import requests
import json
import base64

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
            from Crypto.Cipher import DES
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
            # print(f"Decryption Error: {e}")
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
            
            serialized = []
            for item in results:
                song_id = item.get("id")
                enc_url = item.get("encrypted_media_url")
                
                stream_url = self.decrypt_url(enc_url) if enc_url else None
                image = item.get("image", "").replace("150x150", "500x500")
                
                serialized.append({
                     "id": song_id,
                     "title": item.get("song"),
                     "artist": item.get("singers"), 
                     "album": item.get("album"),
                     "thumbnail": image,
                     "streamUrl": stream_url,
                     "videoId": song_id 
                })
            return serialized
        except Exception as e:
            print(f"Search Error: {e}")
            return []

    def get_charts(self, category="all"):
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
        params = {
            "__call": "song.getDetails",
            "_format": "json",
            "pids": song_id
        }
        try:
            resp = requests.get(self.base_url, params=params, headers=self.headers)
            data = resp.json()
            if song_id in data:
                item = data[song_id]
                return {
                    "id": item.get("id"),
                    "title": item.get("song"),
                    "artist": item.get("singers") or item.get("primary_artists"),
                    "thumbnail": item.get("image", "")
                }
            return None
        except:
            return None

    def get_recommendations(self, song_id):
        params = {
            "__call": "webradio.getSong",
            "stationid": f'{{"pid":"{song_id}","mode":"song"}}', 
            "k": "20",
            "next": "1", 
            "_format": "json"
        }
        try:
            resp = requests.get(self.base_url, params=params, headers=self.headers)
            data = resp.json()
            serialized = []
            
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
            
            song_full = self.get_song(song_id)
            if song_full and 'artist' in song_full:
                return self.search_songs(f"{song_full['artist']} best songs")
            
            return self.search_songs("Viral Hits")
        except Exception as e:
            return self.search_songs("Recommended")
