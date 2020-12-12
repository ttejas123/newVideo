const socket = io('/');  //socket connection
const videoGrid = document.getElementById('video-grid');
const userDropDown = document.getElementById('myDropdown');
const myVideo = document.createElement('video');
myVideo.muted = true;
let peers = {}, currentPeer = [];
let userlist= [];
let cUser, getBoisData =  "This is boies data";

let YourName = prompt('Type Your Name'); //set your name for meeting

var peer = new Peer(undefined,{   //we undefine this because peer server create it's own user id
  path: '/peerjs',
  port: 3000, //use 3000 here for local host
  host:'/'
});

let myVideoStream ;
navigator.mediaDevices.getUserMedia = 
   navigator.mediaDevices.getUserMedia 
|| navigator.mediaDevices.webkitGetUserMedia 
|| navigator.mediaDevices.mozGetUserMedia;

if (navigator.mediaDevices.getUserMedia) {
navigator.mediaDevices.getUserMedia({     //by using this we can access user device media(audio, video) 
	video: true,
	audio: true
}).then(stream =>{                        //in this promice we sended media in stream
    addVideoStream(myVideo, stream);
    myVideoStream = stream;

    peer.on('call', call =>{               //here user system answer call and send there video stream to us
          //console.log("answered");        
    	    call.answer(stream);               //via this send video stream to caller
          const video = document.createElement('video');
        	call.on('stream', userVideoStream =>{
               addVideoStream(video, userVideoStream);  
    	    });
          let gride;
          currentPeer.push(call.peerConnection);
          peers[call.peer] = call;
          call.on('close', () =>{
               video.remove()
          })
    });

    socket.on('user-connected', (userId)  =>{   //userconnected so we now ready to share 
      setTimeout(() => {
        //console.log('user ID fetch connection: '+ userId); //video stream
        connectToNewUser(userId, stream);        //user to refer caller
      }, 3000);
    })

}).catch((err) => {
  alert("Erroe :- "+ err);
});
}

//if someone try to join room peer check that user
peer.on('open', async id =>{
   cUser = id; 
   await socket.emit('join-room', ROOM_ID, id);
  
})

socket.on('user-disconnected', userId =>{   //userdisconnected so remove his video
      if(peers[userId]) peers[userId].close();
      //console.log('user ID fetch Disconnect: '+ userId); 
              
}); 


const connectToNewUser = (userId, stream) =>{
	   //console.log('User-connected :-'+userId);
     let call =  peer.call(userId, stream);       //we call new user in room & send our stream
     const video = document.createElement('video');
     call.on('stream', userVideoStream => {
          addVideoStream(video, userVideoStream);  // here we recive other user stream and use to refer them
      })
      call.on('close', () =>{
      	video.remove()
      })
      peers[userId] = call;  //store all usersid to remove after they disconnected
      currentPeer.push(call.peerConnection);
}


 const addVideoStream = (video, stream) =>{      //this help to show and append or add video of other user
	video.srcObject = stream;
  video.controls = true;
	video.addEventListener('loadedmetadata', () =>{
		video.play();
	})
	videoGrid.append(video);
}

//to Mute or Unmute Option method
const muteUnmute = () =>{
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setMuteButton();
  }else{
    setUnmuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
}

const setUnmuteButton = ()=>{
   const html = `<i class="fas fa-microphone"></i>
                <span>Mute</span>`;
   document.querySelector('.Mute__button').innerHTML = html;
}

const setMuteButton = () =>{
  const html = `<i class="fas fa-microphone-slash" style="color:red;"></i>
                <span>Unmute</span>`;
  document.querySelector('.Mute__button').innerHTML = html;
}

//Video ON or OFF
const videoOnOff = () =>{
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    unsetVideoButton();
  }else{
    setVideoButton();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
}

const setVideoButton = ()=>{
   const html = `<i class="fas fa-video"></i>
                <span>Stop Video</span>`;
   document.querySelector('.Video__button').innerHTML = html;
}

const unsetVideoButton = () =>{
  const html = `<i class="fas fa-video-slash" style="color:red;"></i>
                <span>Start Video</span>`;
  document.querySelector('.Video__button').innerHTML = html;
}

//code for disconnect from client
const disconnectNow = ()=>{
    window.location = "http://www.google.com";   
}

//code to share url of roomId
const share =() =>{
  var share = document.createElement('input'),
  text = window.location.href;
  
  //console.log(text);
  document.body.appendChild(share);
  share.value = text;
  share.select();
  document.execCommand('copy');
  document.body.removeChild(share);
  alert('Copied');
 }


 //code of messaging
let text = $('input');

$('html').keydown((e) =>{
  if(e.which == 13 && text.val().length !== 0){
    //console.log(text.val());
    socket.emit('message', text.val(),YourName);
    text.val('')
  }
});

//Print msg in room
socket.on('createMessage', (msg, user) =>{
  $('ul').append(`<li class= "message"><small>~${user}</small><br>${msg}</li>`);
  scrollToBottom();
});

const scrollToBottom = () =>{
  var d = $('.main__chat_window');
  d.scrollTop(d.prop("scrollHeight"));
}

//screenShare 
const screenshare = () =>{
 navigator.mediaDevices.getDisplayMedia({ 
     video:{
       cursor:'always'
     },
     audio:{
            echoCancellation:true,
            noiseSupprission:true
     }
 }).then(stream =>{
     let videoTrack = stream.getVideoTracks()[0];
         videoTrack.onended = function(){
           stopScreenShare();
         }
         for (let x=0;x<currentPeer.length;x++){
           
           let sender = currentPeer[x].getSenders().find(function(s){
              return s.track.kind == videoTrack.kind;
            })
            
            sender.replaceTrack(videoTrack);
       }
   
  })
  
 }

function stopScreenShare(){
  let videoTrack = myVideoStream.getVideoTracks()[0];
  let sender;
  for (let x = 0; x < currentPeer.length ; x++){
          sender = currentPeer[x].getSenders().find(function(s){
              return s.track.kind == videoTrack.kind;
            }) 
          sender.replaceTrack(videoTrack);
  }       
}

//raised hand option
const raisedHand = ()=>{
  const sysbol = "&#9995;";
  socket.emit('message', sysbol, YourName);
  unChangeHandLogo();
}

const unChangeHandLogo = ()=>{
  const html = `<i class="far fa-hand-paper" style="color:red;"></i>
                <span>Raised</span>`;
  document.querySelector('.raisedHand').innerHTML = html;
  changeHandLogo();
}

const changeHandLogo = ()=>{
  setInterval(function(){
    const html = `<i class="far fa-hand-paper" style="color:"white"></i>
                <span>Hand</span>`;
    document.querySelector('.raisedHand').innerHTML = html;
  },3000);
}

//kick option
socket.on('remove-User', (userId) =>{ 
  if (cUser == userId) {
    disconnectNow();
  }
});

const getUsers = ()=>{ 
  socket.emit('seruI',); 
}

const listOfUser = ()=>{
  //userDropDown.innerHTML = '';
  while (userDropDown.firstChild) {
    userDropDown.removeChild(userDropDown.lastChild); //remove user from dropDown list
  }
  //code to add users in dropdown button (participents)
  for (var i = 0; i < userlist.length; i++) {
    var x = document.createElement("a");
    var t = document.createTextNode(`VideoSector ${i+1}`); 
    x.appendChild(t);
    userDropDown.append(x);
  }
  //checking to identify superUser click on whcich userId in DropDown list
  const anchors = document.querySelectorAll('a');
  for (let i = 0; i < anchors.length; i++) {
    anchors[i].addEventListener('click', () => {
        anchoreUser(userlist[i]);
    });
  }
} 

// if superUser remove someone than everyone should do the same
const anchoreUser = (userR)=>{
  socket.emit('removeUser', cUser, userR);
}

//here we geting list of new users in rooms
socket.on('all_users_inRoom', (userI) =>{ 
      userlist.splice(0,userlist.length);
      userlist.push.apply(userlist ,userI);
      listOfUser();
      document.getElementById("myDropdown").classList.toggle("show");
});