

// Query string stuff.
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
var newTracks = [];
var finUri = [];
var api = null;
var value = 0;
var pText = false;
var pText2 = false;
var pText3 = false;
//************************
//  Logic Controllers
//************************

function populateNewPlaylist() {
    console.log("populateNewPlaylist");
    var tracks = [];
    // Todo - "20" should be static variable, and should be 50?
    console.log(songs.length);
    if(songs.length <= 0) {
        loaded = true;
        loadingFinished();
        return true;
    }

    for (var i = 0; i < 50; i++) {
        if(songs.length > 0) {
            index = Math.floor(Math.random()*songs.length);
            // Todo - Why are we getting null ids
            if(songs[index].track.id) {
                tracks.push('spotify:track:' + songs[index].track.id);
            }
            songs.splice(index, 1);
        }
    }

    console.log("populateNewPlaylist TRY AGAIN");
    api.addTracksToPlaylist(user.id, shufflePlaylist.id, tracks).then(function(data) {
        console.log("populateNewPlaylist Callback");
        populateNewPlaylist();
        // if (!loaded) {
        //     loaded = true;
        //     loadingFinished();
        // }
    });

}

function createNewPlaylist() {
    console.log("createNewPlaylist");
    api.createPlaylist(user.id, {"name":"SpotifyShuffle.com"}).then(function(data) {
        console.log(data);
        shufflePlaylist = data;
        populateNewPlaylist();
    });

}

function doesPlaylistExist() {
    thirdProgress();
    console.log("doesPlaylistExist");
    if (shufflePlaylist) {
        return true;

    }
    return false;
}

function getPlaylistId(playlist) {
    console.log("getPlaylistId");
    secondProgress();
    if(!doesPlaylistExist()) {
        if(playlist.name === playlistName){
            shufflePlaylist = playlist;
            return true;
        }
    }
    return false;
}

function deletePlaylist() {
    console.log("deletePlaylist");
    var totalTracks = shufflePlaylist.tracks.total;
    console.log("totalTracks: " + totalTracks);
    console.log("Check The Data FIRST");
    console.log(shufflePlaylist.id);
    console.log(posArray);
    console.log(shufflePlaylist.snapshot_id);

    if(totalTracks>0){
        var posArray = [];
        for(i=0; i<totalTracks; i++) {
            posArray.push(i);
        }
        while(totalTracks > 0) {
            posArray.slice(Math.max(0, totalTracks-100), totalTracks);
            totalTracks -= 100;
        }
        console.log("Check The Data RIGHT BEFORE DELETE");
        console.log(shufflePlaylist.id);
        console.log(posArray);
        console.log(shufflePlaylist.snapshot_id);
        api.removeTracksFromPlaylistInPositions(user.id, shufflePlaylist.id, posArray, shufflePlaylist.snapshot_id).then(function(data) {
            populateNewPlaylist();
        });
    } else {
        populateNewPlaylist();
    }
}

function getSongs(page, playlist) {
    console.log("getSongs");
    //call first loading bar function
    firstProgress();
    //();

    console.log("called progressText");
    var playlistFound = false;
    if(!playlist) {
        playlist = playlists.shift();
        playlistFound = getPlaylistId(playlist);
    }

    if(!playlistFound) {
        api.getPlaylistTracks(user.id, playlist.id, {offset: page, limit: 50}).then(function(data) {
            songs.push.apply(songs, data.items);
            if (data.items.length >= 50) {
                getSongs(page+50, playlist);
            } else {
                // Once we grab all of the songs, kick off creating and filling new SpotifyShuffle.com Playlist
                if(playlists.length <= 0) {
                    if(doesPlaylistExist()) {
                        deletePlaylist();
                    } else {
                        createNewPlaylist();
                    }
                } else {
                    getSongs(0, false);
                }
            }
        }, function(err) {
            console.log("Failed To Get Playlist: " + playlist.name);
            getSongs(0, false);
        });
    } else {
        getSongs(0, false);
    }
}

// function progressText() {
//     if(pText === false) {
//         $('.progressText').append("<h4>Accessing your playlists<h4>");
//         pText = true;
//     }
// }



// *********************************************
// Progress Bar
// *********************************************

function firstProgress() {
  if(value <= 30) {
    if(pText === false) {
      value = value + 10;
      $('.progressText').append("<h4>Accessing your playlists<h4>");
      pText = true;
      secondProgress();
    }
  }
}

function secondProgress() {
  // if(value > 30 && value <= 60) {
    if(pText2 === false) {
      // value = value + 3;
      $('.progressText').delay(3000).append("<h4>Shuffling your tunes<h4>");
      pText2 = true;
      thirdProgress();
    }
  // }
}

function thirdProgress() {
  // if(value > 60 && value <= 100) {
    if(pText3 === false) {
      // value = value + 5;
      $('.progressText').append("<h4>Creating your new playlist<h4>");
      pText3 = true;
    }
  // }
}


function getPlaylists(page) {
    console.log("getPlaylists");
    firstProgress();
    api.getUserPlaylists(user.id, {offset: page, limit: 50}).then(function(data) {
        playlists.push.apply(playlists, data.items);
        if(data.items.length >= 50) {
            getPlaylists(page+50);
        } else {
            getSongs(0);
            return true;
        }
    }, function(err) {
        console.error(err);
        error = err;
        return false;
    });
}

function getUser() {
    console.log("getUser");
    api.getMe().then(function(data) {
        user = data;
        getPlaylists(0);
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
    console.log("loading page state controller")
    $( document ).ready(function() {
        $('#cards').removeClass('hidden');
        $('.button').addClass('hidden');
    });

    // //green sock animation ----------------------------------
    // var card1 = document.getElementById("card1");
    // var card1Tween = new TweenMax.to(card1, 2, {scale:0.5, repeat:-1, yoyo:true, bezier:{values:[{x:100, y:250}, {x:200, y:375}, {x:300, y:500}]}, ease:Power1.easeOut});

    // var card2 = document.getElementById("card2");
    // var card2Tween = new TweenMax.to(card2, 2, {scale:0.5, repeat:-1, yoyo:true, bezier:{values:[{x:-100, y:250}, {x:-200, y:375}, {x:-300, y:500}]}, ease:Power1.easeOut});

    // var card3 = document.getElementById("card3");
    // var card3Tween = new TweenMax.to(card3, 2, {scale:0.5, repeat:-1, yoyo:true, bezier:{values:[{x:-400, y:250}, {x:-700, y:375}, {x:-900, y:500}]}, ease:Power1.easeOut});
    // //-------------------------------------------

}

function loadingFinished() {
    console.log("loadingFinished")
    $('.progress').hide();
    $('.progressText').hide();
    $('#spotify-player').html('<iframe src="https://embed.spotify.com/?uri=spotify:user:' + user.id + ':playlist:'+ shufflePlaylist.id +'&theme=white" frameborder="0" allowtransparency="true"  width="640" height="720"></iframe>');
    $('#loading-gif').hide();
    $('#cards').hide();
}

//************************
//  Main jQuery Function
//************************
$(function(){
    var access_token = $.QueryString["access_token"];
    if (access_token != null) {
        loading(access_token);
        api = new SpotifyWebApi();
        api.setAccessToken(access_token);
        getUser();
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
