let url = new URL(window.location.href);
let user_id = url.searchParams.get("id");
let user_image = document.getElementById('user-image');
let username = document.getElementById('username');
let feeds = document.getElementById('feed-list');
let status_div = document.getElementById('feed-list');
let feed_list = [];
let user_list = [];
let comment_list = [];
let status_loaded = false;
let image_loaded = false;
let users_loaded = false;
let comments_loaded = false;


function signupF() {
    let user = {
        id: makeid(),
        firstName: document.getElementById("first_name").value,
        lastName: document.getElementById("last_name").value,
        username: document.getElementById("username").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        image: null
    }
    // Reset error messages
    let errors = document.getElementById("errors");
    let success = document.getElementById("succsess");
    errors.innerHTML = '';
    success.innerHTML = '';
    
    // Validation rules
    const format = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    const emailPat = /[a-z]+@[a-z]+\.[a-z]{2}/;
    const passwordPat = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W])[A-Za-z\d\W]{8,}/
    let valid = true;
    if(user.firstName === "") {
        errors.innerHTML += '<div>Enter correct First name</div>' 
        valid = false; 
    }
    if(user.lastName === "") {
        errors.innerHTML += '<div>Enter correct Last name</div>' 
        valid = false; 
    }
    if(format.test(user.username)) {
        errors.innerHTML += '<div>Username can\'t contain special characters.</div>';
        valid = false;
    }
    if(!emailPat.test(user.email)) {
        errors.innerHTML += '<div>Enter correct Email</div>';
        valid = false;  
    }
    if(!passwordPat.test(user.password)) {
        errors.innerHTML += '<div>Bad password</div>';
        valid = false;
    }

    if(user.username.length < 5 || user.username.length > 12) {
        errors.innerHTML += '<div>Username must contain between 5 and 12 characters.</div>';
        valid = false;
    }

    if(user.password.length < 5 || user.password.length > 12) {
        errors.innerHTML += '<div>Password must contain between 5 and 12 characters.</div>';
        valid = false;
    }

    if(valid) {
        
        let http = new XMLHttpRequest();
        http.open('POST', 'php/add_user.php', true);
        http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

        // Listener for waiting backend actions
        http.onreadystatechange = function() {
            if(http.readyState == 4 && http.status == 200) {
                // Converting JSON to JS object
                let data = JSON.parse(http.responseText);
                if(data.success != '') {
                    success.innerHTML = '<div>New user registered.</div>';
                }
            }
        }
        let data = JSON.stringify(user);
        http.send(data);
    }    
}
// Generate random characters for id
function makeid() {
    let newId = "";
    let combination = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
    for (let i = 0; i < 10; i++)
      newId += combination.charAt(Math.floor(Math.random() * combination.length));
    return newId;
  }

  function loginF() {
    let user = {
        id: null,
        username: document.getElementById("login_username").value,
        password: document.getElementById("login_password").value
    }

    let errorDiv = document.getElementById('login_error');
    errorDiv.innerHTML = '';

    let http = new XMLHttpRequest();
    http.open('GET', 'php/get_users.php', true);
    http.onreadystatechange = function() {
        if(http.readyState == 4 && http.status == 200) {
            let data = JSON.parse(http.responseText);
            data.data.forEach(function(user_data) {
                if(user_data.username == user.username && user_data.password == (user.password)){
                    localStorage.setItem('user_id', user_data.id);
                    user.id = user_data.id;
                }
            });
            if(user.id != null) {
                document.location.replace('home.html');
            } else {
                errorDiv.innerHTML = '<div>Wrong username and password combination.</div>';
            }
        }
    }
    http.send(null);
}


function changeProfileImage() {
    errors.innerHTML = '';
    success.innerHTML = '';
    let profile_image = document.getElementById('profile-image').files[0];
    if(profile_image != undefined) {
        let url = 'php/profile_image_upload.php?user_id=' + user_id;
    
        let formData = new FormData();
        formData.append('image', profile_image);

        fetch(url, {
            method: 'POST',
            body: formData
        }).then(response => {            
            if(response.status == 200) {
                success.innerHTML = '<div class="success-msg">User profile image updated.</div>';
                setTimeout(refreshPage, 2000);
            } else {
                errors.innerHTML = '<div class="error-msg">Error during upload image.</div>';
            }
        });
    } else {
        errors.innerHTML = '<div class="error-msg">Plase select image.</div>';
    }

}

// Reloading current image
function refreshPage() {
    location.reload();
}





function getImages(statuses_for_user = null) {
    let http = new XMLHttpRequest();
    http.open('GET', 'php/get_images.php', true);
    http.onreadystatechange = function() {
        if(http.readyState == 4 && http.status == 200) {
            let data = JSON.parse(http.responseText);
            if(data.data != '') {
                data.data.forEach(function(image) {
                    let item = {
                        id: image.id,
                        type: 'image',
                        datetime: image.date_uploaded.replace("_", " "),
                        author: image.user_id,
                        content: image.name,
                        timestamp: image.timestamp,
                        private: image.private
                    }
                    
                    if(statuses_for_user != null) {
                        if(image.user_id == statuses_for_user && image.private != true) {                            
                            feed_list.push(item);
                        }
                    } else {
                        feed_list.push(item);
                    }
                });                
                image_loaded = true;
                sortFeeds();
            }
        }
    }
    http.send(null);
}
function getStatuses(statuses_for_user = null) {
    let http = new XMLHttpRequest();
    http.open('GET', 'php/get_statuses.php', true);
    http.onreadystatechange = function() {
        if(http.readyState == 4 && http.status == 200) {
            let data = JSON.parse(http.responseText);
            if(data.data != '') {
                data.data.forEach(function(status) {
                    let item = {
                        id: status.id,
                        type: 'status',
                        datetime: status.created_at.replace("_", " "),
                        author: status.user_id,
                        content: status.status.replace("_", " "),
                        timestamp: status.timestamp,
                        private: false
                    }
                    if(statuses_for_user != null) {
                        if(status.user_id == statuses_for_user) {                            
                            feed_list.push(item);
                        }
                    } else {
                        feed_list.push(item);
                    }
                    
                });
                status_loaded = true;
                sortFeeds();
            }
        }
    }
    http.send(null);
}


function getUsers(get_user = false) {
    user_list = [];
    let http = new XMLHttpRequest();
    http.open('GET', 'php/get_users.php', true);
    http.onreadystatechange = function() {
        if(http.readyState == 4 && http.status == 200) {
            let data = JSON.parse(http.responseText);
            if(data.data != '') {
                data.data.forEach(function(user) {
                    let item = {
                        id: user.id,
                        name: user.first_name + ' ' + user.last_name,
                        image: user.image
                    }
                    user_list.push(item);
                });
                users_loaded = true;
                if(get_user) {
                    displayUser();
                } else {
                    sortFeeds();    
                }
            }
        }
    }
    http.send(null);
}


function getUserProfile() {
    let user_profile = {};
    let user_image_div = document.getElementById('user-image');
    let username_div = document.getElementById('username');
    let http = new XMLHttpRequest();
    http.open('GET', 'php/get_users.php', true);
    http.onreadystatechange = function() {
        if(http.readyState == 4 && http.status == 200) {
            let data = JSON.parse(http.responseText);
            if(data.data != '') {
                data.data.forEach(function(user_data) {
                    if(user_data.id == user_id){              
                        user_profile = user_data;
                    }
                });                
                if(user_profile.image != null) {
                    user_image_div.innerHTML = '<img src="img/'+user_profile.image+'" />';
                } else {
                    user_image_div.innerHTML = '<img src="img/no-img.png" />';
                }
                username_div.innerHTML = user_profile.username;
            }
        }
    }
    http.send(null);
}


function loadData() {
    getStatuses();
    getImages();
    getUsers();
    getUserProfile();
}

// Function for checking if user is logged in

function checkLogin(){
    if(user_id !== null) {
        document.location.replace('index.html');
    } else {
        document.getElementsByTagName('nav')[0].innerHTML += '<a href="#" onclick="logout()">Logout</a>';
    }
}

function displayFeeds() {
    status_div.innerHTML = '';
    feed_list.forEach(function(feed) {
        if(feed.private && feed.author != user_id) {
            console.log(feed);
        } else {
            let feed_content = '<div class="feed-content">';        
            user_list.forEach(function(user) {
                if(user.id == feed.author) {
                    feed_content += '<div class="feed-author"><a href="users.html?id=' + user.id + '">';
                    if(user.image == null){
                        feed_content += '<img src="img/no-img.png" />';
                    } else {
                        feed_content += '<img src="img/' + user.image + '" />';
                    }
                    feed_content += '</a>' + user.name + '</div>';
                }
            });
            feed_content += '<div class="feed-body">';
            if(feed.type == 'image') {
                feed_content += '<a href="image.html?id=' + feed.id + '"><img src="img/' + feed.content + '" /></a>';
            } else {
                feed_content += '<p class="feed-status">' + feed.content + '</p>';
            }
            feed_content += '<p class="created">' + feed.datetime + '</p></div></div>';
            status_div.innerHTML += feed_content;
        }
    });
}

function sortFeeds() {
    feed_list.sort(function(x, y){
        return y.timestamp - x.timestamp;
    });
    if((image_loaded || status_loaded) && users_loaded) {
        displayFeeds();
    }
}

// Function for logging out user
function logout() {
    localStorage.removeItem('user_id');
    document.location.replace('index.html');
}

// Return current datetime string
function getDateTime() {
    let currentdate = new Date(); 
    return currentdate.getDate() + "/"
            + (currentdate.getMonth()+1)  + "/" 
            + currentdate.getFullYear() + " "  
            + currentdate.getHours() + ":"  
            + currentdate.getMinutes();
}

// Return current timestamp as numeric record
function getTimestamp() {
    return new Date().getTime();
}

function addStatus() {
    let valid = true;
    let status_content = document.getElementById("status").value;
    if(status_content.length > 140) {
        errors.innerHTML += '<div class="error-msg">Status must contain maximum 140 characters.</div>';
        valid = false;
    }
    if(valid) {
        let status = {
            id: makeid(),
            user_id: user_id,
            status: status_content,
            created_at: getDateTime(),
            timestamp: getTimestamp()
        }

        // Reset error messages
        errors.innerHTML = '';
        success.innerHTML = '';

        let http = new XMLHttpRequest();
        http.open('POST', 'php/add_status.php', true);
        http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

        // Listener for waiting backend actions
        http.onreadystatechange = function() {
            if(http.readyState == 4 && http.status == 200) {
                // Converting JSON to JS object
                let data = JSON.parse(http.responseText);
                if(data.success != '') {
                    success.innerHTML = '<div class="success-msg">New status created.</div>';
                    setTimeout(refreshPage, 1000);
                }
            }
        }
        let data = JSON.stringify(status);
        http.send(data);
    }
}


function addImage() {
    let image = document.getElementById('image').files[0];
    let checkbox = document.getElementById('private');
    let private = false;
    if(checkbox.checked == true) {
        private = true;
    }
    if(image != undefined) {
        let url = 'php/upload.php?user_id=' + user_id + '&private=' + private + '&timestamp=' + getTimestamp();
    
        let formData = new FormData();
        formData.append('image', image);

        fetch(url, {
            method: 'POST',
            body: formData
        }).then(response => {
            errors.innerHTML = '';
            success.innerHTML = '';

            if(response.status == 200) {
                success.innerHTML = '<div class="success-msg">New image created.</div>';
                setTimeout(refreshPage, 1000);
            } else {
                errors.innerHTML = '<div class="error-msg">Error during upload image.</div>';
            }
        });
    } else {
        errors.innerHTML = '<div class="error-msg">Please choose image.</div>';
    }
    sortFeeds();
}



function loadImageData() {    
   let http = new XMLHttpRequest();
    getUsers();
    getComments();
    http.open('GET', 'php/get_images.php', true);
    http.onreadystatechange = function() {
        if(http.readyState == 4 && http.status == 200) {
            let data = JSON.parse(http.responseText);
            if(data.data != '') {
                data.data.forEach(function(image) {
                    if(image.id == image_id) {                        
                        image_container.innerHTML = '<img src="img/' + image.name + '" />';
                        user_list.forEach(function(user){
                            if(image.user_id == user.id) {
                                if(user.image == null) {
                                    author_image.innerHTML = '<a href="user.html?id=' + user.id + '"><img class="author-image" src="img/no-img.png"></a>';
                                } else {
                                    author_image.innerHTML = '<a href="user.html?id=' + user.id + '"><img class="author-image" src="img/' + user.image + '"></a>';
                                }
                                author_name.innerHTML = '<p class="author-name">' + user.name + '</p>';
                            }
                        });
                    }
                });
            }
        }
    }
    http.send(null);    
}