import requests
import json
import base64
from Crypto.Cipher import DES

class JioSaavnClient:
    def __init__(self):
        self.base_url = "https://www.jiosaavn.com/api.php"
        # Standard generic headers to mimic a browser/client
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.72 Safari/537.36",
            "Accept": "application/json, text/plain, */*"
        }
        self.des_key = b"38346591"

    def decrypt_url(self, encrypted_url):
        try:
            cipher = DES.new(self.des_key, DES.MODE_ECB)
            # Add padding if necessary for base64 decode (standard base64 usually)
            encrypted_data = base64.b64decode(encrypted_url)
            decrypted_data = cipher.decrypt(encrypted_data)
            # Proper PKCS7 unpadding
            pad_len = decrypted_data[-1]
            if isinstance(pad_len, str):
                pad_len = ord(pad_len) # Handle if python version differences returns char
            
            url = decrypted_data[:-pad_len].decode('utf-8')
            
            # Upgrade quality logic
            url = url.replace("_96.mp4", "_320.mp4")
            url = url.replace("_160.mp4", "_320.mp4")
            url = url.replace("_96.m4a", "_320.m4a")
            url = url.replace("_160.m4a", "_320.m4a")
            
            return url
        except Exception as e:
            print(f"Decryption Error: {e}")
            return None

    def search_songs(self, query):
        params = {
            "__call": "search.getResults",
            "_format": "json",
            "_marker": "0",
            "p": "1",
            "n": "20",
            "q": query
        }
        try:
            resp = requests.get(self.base_url, params=params, headers=self.headers)
            data = resp.json()
            results = data.get("results", [])
            
            # Normalize to our app's structure
            # SongCard expects: title, artist, album, thumbnail, videoId (we will use 'id' here)
            serialized = []
            for item in results:
                # Get ID
                song_id = item.get("id")
                # Get Encrypted Media URL
                enc_url = item.get("encrypted_media_url")
                
                # We can decrypt it now OR decrypt on demand
                # Decrypting now makes the frontend immediate for playback
                stream_url = self.decrypt_url(enc_url) if enc_url else None
                
                image = item.get("image", "").replace("150x150", "500x500")
                
                serialized.append({
                     "id": song_id,
                     "title": item.get("song"),
                     "artist": item.get("singers"), # or primary_artists
                     "album": item.get("album"),
                     "thumbnail": image,
                     "streamUrl": stream_url,
                     # We keep 'videoId' for compatibility for now, but fill it with ID
                     "videoId": song_id 
                })
            return serialized
        except Exception as e:
            print(f"Search Error: {e}")
            return []

    def get_charts(self, category="all"):
        # Map categories to JioSaavn search terms
        cat_map = {
            "all": "Trending India",
            "phonk": "Best Phonk Music",
            "bollywood": "Bollywood Top 50",
            "old": "Old Hindi Songs Retro",
            "hollywood": "English Top 50 Global",
            "japanese": "Japanese Pop Anime",
            "lofi": "Lofi Beats",
            "punjabi": "Punjabi Top 50"
        }
        
        search_query = cat_map.get(category.lower(), category)
        print(f"Fetching charts for category: {category} -> Query: {search_query}")
        
        return self.search_songs(search_query)

    def get_song(self, song_id):
        # Used if we only have ID and need details
        params = {
            "__call": "song.getDetails",
            "_format": "json",
            "pids": song_id
        }
        try:
            resp = requests.get(self.base_url, params=params, headers=self.headers)
            data = resp.json()
            # song.getDetails returns dict where key is ID, OR 'songs' list
            # usually: { "id": { ... } } or { "songs": [ ... ] }
            
            # Key might be the PID string
            if song_id in data:
                item = data[song_id]
                return {
                    "id": item.get("id"),
                    "title": item.get("song"),
                    "artist": item.get("singers") or item.get("primary_artists"),
                    "thumbnail": item.get("image", "")
                }
            # Fallback if structure differs
            return None
        except:
            return None

    def get_recommendations(self, song_id):
        # "Spotify-like" Algorithm: Station API
        # Create a station from the song_id and fetch next song
        params = {
            "__call": "webradio.getSong",
            "stationid": f'{{"pid":"{song_id}","mode":"song"}}', # Station ID format for song radio
            "k": "20",
            "next": "1", # Getting next songs
            "_format": "json"
        }
        try:
            resp = requests.get(self.base_url, params=params, headers=self.headers)
            # Response is usually a single song or list in [key]
            data = resp.json()
            
            # The structure for radio response varies.
            # Often keys are just IDs or a list.
            # Let's inspect typical response or safer approach: 
            # The 'webradio.getSong' often creates a radio and returns the first song(s).
            
            serialized = []
            # Often response is a dict where keys are the items. Complex to parse blindly.
            # Fallback: Search for the Artist + "Similar" or just return search results for the artist
            
            # Safer robust "Algo":
            # 1. Get Song Details -> Get Artist
            # 2. Search Artist or Get Artist Top Songs
            song_data = self.get_song(song_id)
            if song_data and song_data.get('id'):
                # Basic Recommendation: Search for the title/artist mix to find covers/remixes/similar
                # better: Artist Mix
                # Even better: Use the API's "more like this" or similar functionality if standard.
                
                # Let's try the station API response assumption:
                if isinstance(data, dict) and 'error' not in data:
                     for k, item in data.items():
                        if isinstance(item, dict) and 'id' in item:
                             enc_url = item.get("encrypted_media_url")
                             stream_url = self.decrypt_url(enc_url) if enc_url else None
                             serialized.append({
                                "id": item.get("id"),
                                "title": item.get("song"),
                                "artist": item.get("singers"), 
                                "album": item.get("album"),
                                "thumbnail": item.get("image", "").replace("150x150", "500x500"),
                                "streamUrl": stream_url,
                                "videoId": item.get("id") 
                            })
            
            if serialized: return serialized
            
            # Fallback 1: Search for the Artist to keep the "Category/Vibe" same
            # This ensures if you play Arijit, you get Arijit next.
            song_full = self.get_song(song_id)
            if song_full and 'artist' in song_full:
                print(f"Radio failed, falling back to Artist Mix: {song_full['artist']}")
                return self.search_songs(f"{song_full['artist']} best songs")
            
            # Fallback 2: Generic Viral
            return self.search_songs("Viral Hits")

        except Exception as e:
            print(f"Rec Error: {e}")
            return self.search_songs("Recommended")
