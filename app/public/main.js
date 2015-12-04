

// Query string stuff. Ignore.
(function($) {
    $.QueryString = (function(a) {
        if (a == "") return {};
            var b = {};
            for (var i = 0; i < a.length; ++i)  {
                var p=a[i].split('=');
                if (p.length != 2) continue;
                    b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
            }
            return b;
        })(window.location.search.substr(1).split('&'))
})(jQuery);

// Global Variables 
var playlists = [];
var songs = [];
var song_string = "";
var user = null;

var loaded = false;
var error = false;
var songMax = 300;
var playlistName = "SpotifyShuffle.com"
var shufflePlaylist = false;
var currentPlaylistUris = [];
var uris = [];

//************************
//  Logic Controllers
//************************

function replaceOldPlaylist(api, token, playlist) {
    //replace "SpotifyShuffle Playlist" with new randomization of songs
    //break out randomization to this function
    //PUT https://api.spotify.com/v1/users/{user_id}/playlists/{playlist_id}/tracks
    newTracks = [];
        //randomize new songs
        // push to newTracks array
  
        if(songs.length < songMax) {
            songMax = songs.length - 1;
        }

        for (var i = 0; i < songMax; i++) {
            // console.log(songs.length -1);
            index = Math.floor(Math.random()*songs.length);
            // console.log(index);

            song_string += songs[index].track.id + ',';
            songs.splice(index, 1);
        }

        song_string = song_string.slice(0, -1);
        loaded = true;
        loadingFinished();
    //randomize new songs and push them into newTracks[];
    // api.replaceTracksInPlaylist(user.id, shufflePlaylist.id, newTracks);


}

function createNewPlaylist(api, token) {
    // POST https://api.spotify.com/v1/users/{user_id}/playlists
    api.createPlaylist(user.id, {"name":"SpotifyShuffle.com"}).then(function(data) {
        console.log('Ok. Playlist created!');
    });

}

function playlistsExists() {
    if (!doesPlaylistExist())
        createNewPlaylist();
}

function doesPlaylistExist() {
    if (shufflePlaylist) {
        return true;
    }
    return false;
}

function getPlaylistId(playlist) {
    if(!doesPlaylistExist()) {
        console.log(playlist.name);
        if(playlist.name === playlistName){
            shufflePlaylist.id 
            shufflePlaylist = playlist;
            return true;
        }
    }
}

// function getCurrentSsPlaylistsUris(playlistId) {
//     if(getPlaylistId()) {
//         //get track uris from playlist them pass them to global variable currentPlaylistUris
//         api.getPlaylistTracks(user.id, playlist.id, {offset: page, limit: 50}).then(function(data) {
//             console.log(playlist.track.id);
//         });
//         //push them to currentPlaylistUris


//     }
// }

function deletePlaylist(api, token) {
    //  DELETE /v1/users/{user_id}/playlists/{playlist_id}/tracks  Remove tracks from a playlist
    // https://developer.spotify.com/web-api/remove-tracks-playlist/
    console.log('--- deletePlaylist');
    console.log(shufflePlaylist);
    console.log(shufflePlaylist.id);
    var totalTracks = shufflePlaylist.tracks.total;
    if(totalTracks>0){
        var posArray = [];
        for(i=0; i<totalTracks; i++) {
            posArray.push(i);
        }
        while(totalTracks > 0) {
            posArray.slice(Math.max(0, totalTracks-100), totalTracks);
            totalTracks -= 100;
        }
        api.removeTracksFromPlaylistInPositions(user.id, shufflePlaylist.id, posArray, shufflePlaylist.snapshot_id).then(function(data) {
            console.log("Got to line 112");
        });
    } 
    replaceOldPlaylist(api, token);
}



function getSongs(api, token, page, playlist) {
    if(!playlist) {
        playlist = playlists.shift();
        getPlaylistId(playlist);
    }

    api.getPlaylistTracks(user.id, playlist.id, {offset: page, limit: 50}).then(function(data) {
        songs.push.apply(songs, data.items);

        if (data.items.length >= 50) {
            getSongs(api, token, page+50, playlist);
        } else {
            // This is where it finishes getting all the songs and kicks everythng off.
            // Todo - Break this out into another LOGIC CONTROLLER
            // Todo - From here call the new randomzie song list
            if(playlists.length <= 0) {
                if(doesPlaylistExist()){
                    // console.log("We Got It: " + playlistId);

                    deletePlaylist(api, token);

                } else {
                    console.log("We DIDNT GET IT");
                }

                // if(songs.length < songMax) {
                //     songMax = songs.length - 1;
                // }

                // for (var i = 0; i < songMax; i++) {
                //     // console.log(songs.length -1);
                //     index = Math.floor(Math.random()*songs.length);
                //     // console.log(index);

                //     song_string += songs[index].track.id + ',';
                //     songs.splice(index, 1);
                // }

                // song_string = song_string.slice(0, -1);
                // loaded = true;
                // loadingFinished();
        } else {
                getSongs(api, token, 0, false);
            }
        }

    }, function(err) {
        console.log("Failed To Get Playlist: " + playlist.name);
        getSongs(api, token, 0, false);
    });
}

function getPlaylists(api, token, page) {
    api.getUserPlaylists(user.id, {offset: page, limit: 50}).then(function(data) {
        console.log(data);
        playlists.push.apply(playlists, data.items);
        console.log('Length: ' + playlists.length)

        // Todo Change the 50 to a hardcoded variable at the top. Change it everywhere you see 50.
        if(data.items.length >= 50) {
            getPlaylists(api, token, page+50);
        } else {
            getSongs(api, token, 0);
            return true;
        }

    }, function(err) {
        console.error(err);
        error = err;
        return false;
    });
}

function getUser(api, access_token) {
     api.getMe(api).then(function(data) {
            user = data;
            // console.log(user);

            getPlaylists(api, access_token, 0);

            }, function(err) {
                console.error('user is not logged in');
                error = err;
                return false;
            });
}

//************************
//  Page State Controllers 
//************************
function login() {
    // Todo - If this is called it should return the entire screen to the *login* state.

}

function loading(access_token) {
        $( document ).ready(function() {
        $('#loading-gif').html('<img src="/images/loadingLoop.gif", class="loadingGif">');
    });


    var spotifyApi = new SpotifyWebApi();
    spotifyApi.setAccessToken(access_token);
    getUser(spotifyApi, access_token, 0);
}

function loadingFinished() {
    $('#spotify-player').html('<iframe src="https://embed.spotify.com/?uri=spotify:trackset:PREFEREDTITLE:'+ song_string +'&theme=white" frameborder="0" allowtransparency="true"  width="640" height="720"></iframe>');
    $('#loading-gif').hide();
    $('#welcome').html('<h3>Welcome <%= username %>');
}



//************************
//  Main Jquery Function 
//************************
$(function(){
    var access_token = $.QueryString["access_token"];
    if (access_token != null) {
        loading(access_token);
    } else {
        login();
    }
        

    // Todo - If loaded is true do whatever you need to do.
    // Todo - If error show the error to user. Ask them to retry maybe.
    // Todo - IF nothing just keep checking. Once its found never check again.
    // $('#spotify-player').html('<iframe src="https://embed.spotify.com/?uri=spotify:trackset:PREFEREDTITLE:'+ song_string +'"frameborder="0" allowtransparency="true"  width="500" height="500"></iframe>');
    // Todo - Move ^^ THIS ^^ line to that loop once its loaded.

    // Todo - Use jquery to show/hide stuff based on state of loaded and error.


    // Features - Harder
    // Todo - Make it so you can select how many songs you want to randomize. Up to around 300ish. 
    // Todo - Make it so you can select how long you want the playlist to be. 40 Mins? Count the track lengths till you get close.
    // Todo - Make it so you can save create and update playlists. Ask me about this. I can point you in the right direction.
    // Todo - Create an about page. Link to your github. Say you dont store any data locally. 

    
});

