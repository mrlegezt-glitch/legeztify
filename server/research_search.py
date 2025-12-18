import spotdl
import inspect
from spotdl import Spotdl
# Try to find search related classes or functions
print("Contents of spotdl:")
# In 3.9.6, the structure might be different. 
# It likely uses spotipy internally.
try:
    from spotdl.search.spotify_client import SpotifyClient
    print("Found SpotifyClient")
except ImportError:
    print("SpotifyClient not found in spotdl.search.spotify_client")

try:
    import spotipy
    print("Spotipy is available")
except ImportError:
    print("Spotipy not available")
