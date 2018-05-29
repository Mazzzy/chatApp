/**
  * Behavioral layer for chat app
  * Developed: Mazahart Shaikh | @mazahar_shaikh
  * Date: 24 May 2018
  * Purpose: To implement chat feature using WebSockets
  *   It contains feature to add name, add and view chat messages and list of users Online
  *   Connected with server for getting messages
*/
$(function () {
    "use strict";

    // for better performance - to avoid searching in DOM
    var input = $('#input');
    var status = $('#status');
    var messagesBox = $('#messagesBox');
    var users = $('#userList');

    // my color assigned by the server
    var myColor = false;
    // my name sent to the server
    var myName = false;
    // user list received
    var userList = [];

    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    // if browser doesn't support WebSocket, just show some notification and exit
    if (!window.WebSocket) {
        messagesBox.html($('<p>', { text: 'Sorry, but your browser doesn\'t '
                                    + 'support WebSockets.'} ));
        input.hide();
        $('span').hide();
        return;
    }

    // open connection
    var HOST = location.origin.replace(/^http/, 'ws').replace(/:9000/,'');
    var connection = new WebSocket(HOST + ':1337');

    connection.onopen = function () {
        // first we want users to enter their names
        input.removeAttr('disabled');
        status.text('Choose name:');
    };

    connection.onerror = function (error) {
        // just in there were some problems with conenction...
        messagesBox.html($('<p>', { text: 'Sorry, but there\'s some problem with your '
                                    + 'connection or the server is down.' } ));
    };

    // most important part - incoming messages
    connection.onmessage = function (message) {
        // try to parse JSON message. Because we know that the server always returns
        // JSON this should work without any problem but we should make sure that
        // the massage is not chunked or otherwise damaged.
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message.data);
            return;
        }

        // NOTE: if you're not sure about the JSON structure
        // check the server source code above
        if (json.type === 'color') {
            // first response from the server with user's color
            myColor = json.data;
            status.text(myName + ': ').css('color', myColor);
            input.removeAttr('disabled').focus();
            // from now user can start sending messages
        } else if (json.type === 'history') {
            // entire message history
            // insert every single message to the chat window
            for (var i=0; i < json.data.length; i++) {
                addMessage(json.data[i].author, json.data[i].text,
                           json.data[i].color, new Date(json.data[i].time));
                // add userlist
                addUser(json.data[i].author);
            }
        } else if (json.type === 'message') {
            // it's a single message
            input.removeAttr('disabled');
            // let the user write another message
            addMessage(json.data.author, json.data.text,
                       json.data.color, new Date(json.data.time));
            // add singleUser
            addUser(json.data.author);
        } else {
            console.log('Hmm..., I\'ve never seen JSON like this: ', json);
        }
    };

    /**
     * Send mesage when user presses Enter key
     */
    input.keydown(function(e) {
        if (e.keyCode === 13) {
            var msg = $(this).val();
            if (!msg) {
                return;
            }
            // send the message as an ordinary text
            connection.send(msg);
            $(this).val('');
            // disable the input field to make the user wait until server
            // sends back response
            input.attr('disabled', 'disabled');

            // we know that the first message sent from a user their name
            if (myName === false) {
                myName = msg;
            }
        }
    });

    /**
     * This method is optional. If the server wasn't able to respond to the
     * in 3 seconds then show some error message to notify the user that
     * something is wrong.
     */
    setInterval(function() {
        if (connection.readyState !== 1) {
            status.text('Error');
            input.attr('disabled', 'disabled').val('Unable to comminucate '
                                                 + 'with the WebSocket server.');
        }
    }, 3000);

    /**
     * Add message to the chat window
     */
    function addMessage(author, message, color, dt) {
      var currentUser = (author === myName) ? 'current-user' :'';
       messagesBox.append('<div class="user-message '+currentUser+'">'
                              +'<p class="name">'
                              +  '<span style="color:' + color + '">' + author + '</span>'
                              +'</p><br/>'
                              +'<p class="message">' + message + '</p>'
                              +'<p class="duration">'
                              +  (dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours()) + ':'
                              +  (dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes())
                              +'</p>'
                            +'</div>');
    }

    /**
     * Add Users to the userlist window
     */
    function addUser(author) {
      // check if user is present or push it
      var isPresent = isInArray(author, userList);
      if(!isPresent){
        // push to userList
        userList.push(author);
        // add it to the DOM
        users.append('<div class="user-active"><p>'+author+'</p></div>');
      }

    }

    /**
     * Helper functions
     */
    function isInArray(value, array) {
      return array.indexOf(value) > -1;
    }
});
