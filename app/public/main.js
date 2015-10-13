function preloader(){
    document.getElementById("loading").style.display = "none";
    document.getElementById("content").style.display = "block";
}//preloader
window.onload = preloader;




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

function getSongs(api, token, page, playlist) {
    if(!playlist) {
        playlist = playlists.shift();
    }

    api.getPlaylistTracks(user.id, playlist.id, {offset: page, limit: 50}).then(function(data) {
        songs.push.apply(songs, data.items);

        if (data.items.length >= 50) {
            getSongs(api, token, page+50, playlist);
        } else {
            // This is where it finishes getting all the songs and kicks everythng off.
            if(playlists.length <= 0) {
                if(songs.length < songMax) {
                    songMax = songs.length - 1;
                    // songMax = 3;
                } 
                console.log('SongMax');
                console.log(songMax);
                for (var i = 0; i < songMax; i++) {
                    console.log(songs.length -1 )
                    index = Math.floor(Math.random()*songs.length);
                    console.log(index)

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

function getPlaylists(api, token, page) {
    api.getUserPlaylists(user.id, {offset: page, limit: 50}).then(function(data) {
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
    function preloader(){
    document.getElementById("loading").style.display = "none";
    document.getElementById("content").style.display = "block";
}//preloader
window.onload = preloader;

$("#search").on('click', function() {
    $('#loading').toggle( $("#results").is(':empty') );

    $.ajax({
        url : 'search.php', 
        data: this.value
    }).done(function(data) {
        $('#results').html(data);
    }).always(function() {
        $('#loading').hide();
        if ( $("#results").is(':empty') ) $('#results').html('No results !');
    });
});

    function getUser(api) {
        api.getMe(api).then(function(data) {
            user = data;
            console.log(user);

            getPlaylists(spotifyApi, access_token, 0);

            }, function(err) {
                console.error('user is not logged in');
                error = err;
                return false;
            });
    }
    getUser(spotifyApi);
    return true;
    var banner = new Image();
    var loading = new Image();
    var bannerElement = document.getElementById("banner"); // assumes an element with id "banner" contains the banner image - you can get the element however you want.
    banner.src = "https://media.giphy.com/media/jF1oqkXJL0Mda/giphy.gif";
    loading.src = "http://giphy.com/gifs/sM503VtpDzxLy";
    banner.onload = function() {
        bannerElement.removeChild(bannerElement.lastChild);
        bannerElement.appendChild(banner);
    };
    bannerElement.removeChild(bannerElement.lastChild);
    bannerElement.appendChild(loading);
     
    // function onReady(callback) {
    //     var intervalID = window.setInterval(checkReady, 1000);
    //     function checkReady() {
    //         if (document.getElementsByTagName('body')[0] !== undefined) {
    //             window.clearInterval(intervalID);
    //             callback.call(this);
    //         }
    //     }
    // }

    // function show(id, value) {
    //     document.getElementById(id).style.display = value ? 'block' : 'none';
    // }

    // onReady(function () {
    //     show('page', true);
    //     show('loading', false);        
    // });
        
    // Todo - Testing - Uncomment this to make it actually do the loopup on songs. For now we will fake it for testing.
    // getPlaylists(spotifyApi, access_token, 0);

    // Todo - Testing - Comment out to test full thing.
    // '52xuVonJruElPVfr2HtPNe,5I73HwV82DiWOJfzijlZs6,0sSoc9HhW9xkowdO8HxKPv'
    // song_string = ['52xuVonJruElPVfr2HtPNe,5I73HwV82DiWOJfzijlZs6']
    // $('#spotify-player').html('<iframe src="https://embed.spotify.com/?uri=spotify:trackset:PREFEREDTITLE:'+ song_string +'"frameborder="0" allowtransparency="true"  width="500" height="500"></iframe>');

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

