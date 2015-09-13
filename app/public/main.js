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

// Global Variables - Put main variables here.
var playlists = [];
var songs = [];
var song_string = "";

var loaded = false;
var error = false;

function getSongs(api, token, page, playlist) {
    if(!playlist) {
        playlist = playlists.shift();
    }

    // Todo - Update nmercer88
    api.getPlaylistTracks('nmercer88', playlist.id, {offset: page, limit: 50}).then(function(data) {
        songs.push.apply(songs, data.items);

        if (data.items.length >= 50) {
            getSongs(api, token, page+50, playlist);
        } else {
            // This is where it finishes getting all the songs and kicks everythng off.
            if(playlists.length <= 0) {
                // Todo - Hardcode 300 up top and pass it here. Its how many songs it will grab.
                for (var i = 0; i < 300; i++) {
                    index = Math.floor(Math.random()*songs.length);
                    song_string += songs[index].track.id + ',';
                    songs.splice(index, 1);
                }

                song_string = song_string.slice(0, -1);
                loaded = true;
                $('#spotify-player').html('<iframe src="https://embed.spotify.com/?uri=spotify:trackset:PREFEREDTITLE:'+ song_string +'"frameborder="0" allowtransparency="true"  width="500" height="500"></iframe>');

            } else {
                getSongs(api, token, 0, false);
            }
        }

    }, function(err) {
        console.error(err);
        error = err;
        return false;
    });
}

// Todo - Update nmercer88
function getPlaylists(api, token, page) {
    api.getUserPlaylists('nmercer88', {offset: page, limit: 50}).then(function(data) {
        playlists.push.apply(playlists, data.items);

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


// Main Page JS Function
$(function(){
    var access_token = $.QueryString["access_token"];
    var spotifyApi = new SpotifyWebApi();
    spotifyApi.setAccessToken(access_token);

    // Todo - USE NODEMON
        // http://nodemon.io/
        // nodemon app.js

    // Todo - Change all nmercer88's to your username
    // Todo - Make a call to spotify to get user name based off access_token spotifyApi.getMe(), save it.

    // Todo - Testing - Uncomment this to make it actually do the loopup on songs. For now we will fake it for testing.
    // getPlaylists(spotifyApi, access_token, 0);

    // Todo - Testing - Comment out to test full thing.
    song_string = '52xuVonJruElPVfr2HtPNe,5I73HwV82DiWOJfzijlZs6,0sSoc9HhW9xkowdO8HxKPv'
    $('#spotify-player').html('<iframe src="https://embed.spotify.com/?uri=spotify:trackset:PREFEREDTITLE:'+ song_string +'"frameborder="0" allowtransparency="true"  width="500" height="500"></iframe>');

    // Todo - Create a loop to see if loaded == true or error. Check every millisecond.
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
    // Todo - Create an about page. Link to your github. Say you dont store any data locally. Put that cat picture on it <- Im srs engineers will eat that up ur hawt and cats


});