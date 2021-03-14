const BASE_URL = "https://jsonplace-univclone.herokuapp.com";

function renderUser(user) {
  const userCardEl = $("<div class='user-card'>");

  userCardEl
    .html(
      `
  <header><h2>${user.name}</h2></header>
    <section class="company-info">
      <p><b>Contact:</b> ${user.email}</p>
      <p><b>Works for:</b> ${user.company.name}</p>
      <p><b>Company creed:</b> "${user.company.catchPhrase}, which will ${user.company.bs}!"</p>
    </section>
  <footer>
    <button class="load-posts">POSTS BY ${user.username}</button>
    <button class="load-albums">ALBUMS BY ${user.username}</button>
  </footer>
  `
    )
    .data("user", user);

  return userCardEl;
}

function renderUserList(userList) {
  $("#user-list").empty();

  userList.forEach(function (user) {
    $("#user-list").append(renderUser(user));
  });
}

/* render a single photo */
function renderPhoto(photo) {
  const photoEl = $('<div class="photo-card">');

  photoEl.html(`
    <a href="${photo.url}" target="_blank">
      <img src="${photo.thumbnailUrl}">
      <figure>${photo.title}</figure>
    </a>
  `);

  return photoEl;
}

/* render a single album */
function renderAlbum(album) {
  const albumCardEl = $("<div class='album-card'>");

  albumCardEl.html(`
    <header>
      <h3>${album.title}, By ${album.user.username}</h3>
    </header>
    <section class="photo-list">
    </section>
  `);

  album.photos.forEach(function (photo) {
    albumCardEl.find(".photo-list").append(renderPhoto(photo));
  });

  return albumCardEl;
}

/* render an array of albums */
function renderAlbumList(albumList) {
  $("#app section.active").removeClass("active");
  $("#album-list").addClass("active").empty();

  albumList.forEach(function (album) {
    $("#album-list").append(renderAlbum(album));
  });
}

function setCommentsOnPost(post) {
  if (post.comments) {
    return Promise.reject(null);
  }

  // fetch, upgrade the post object, then return it
  return fetchPostComments(post.id).then(function (comments) {
    post.comments = comments;
    return post;
  });
}

function renderPost(post) {
  const postEl = $("<div class='post-card'>");

  postEl
    .html(
      `  
    <header>
      <h3>${post.title}</h3>
      <h3>--- ${post.user.username}</h3>
    </header>
    <p>${post.body}</p>
    <footer>
      <div class="comment-list"></div>
      <a href="#" class="toggle-comments">(<span class="verb">show</span> comments)</a>
    </footer>
  `
    )
    .data("post", post);

  return postEl;
}

function renderPostList(postList) {
  $("#app section.active").removeClass("active");
  $("#post-list").addClass("active").empty();

  postList.forEach(function (post) {
    $("#post-list").append(renderPost(post));
  });
}

function toggleComments(postCardElement) {
  const footerElement = postCardElement.find("footer");

  if (footerElement.hasClass("comments-open")) {
    footerElement.removeClass("comments-open");
    footerElement.find(".verb").text("show");
  } else {
    footerElement.addClass("comments-open");
    footerElement.find(".verb").text("hide");
  }
}

function fetchData(url) {
  return fetch(url)
    .then(function (data) {
      return data.json();
    })
    .catch(function (error) {
      console.error(error);
    });
}

function fetchUsers() {
  return fetchData(`${BASE_URL}/users`);
}

function bootstrap() {
  fetchUsers().then(renderUserList);
}

bootstrap();

/* get an album list, or an array of albums */
function fetchUserAlbumList(userId) {
  return fetchData(
    `${BASE_URL}/users/${userId}/albums?_expand=user&_embed=photos`
  );
}

function fetchUserPosts(userId) {
  return fetchData(`${BASE_URL}/users/${userId}/posts?_expand=user`);
}

function fetchPostComments(postId) {
  return fetchData(`${BASE_URL}/posts/${postId}/comments`);
}

$("#user-list").on("click", ".user-card .load-posts", function () {
  // load posts for this user
  const user = $(this).closest(".user-card").data("user");
  // render posts for this user

  fetchUserPosts(user.id).then(renderPostList);
});

$("#user-list").on("click", ".user-card .load-albums", function () {
  // load albums for this user
  const user = $(this).closest(".user-card").data("user");
  // render albums for this user
  fetchUserAlbumList(user.id).then(renderAlbumList);
});

$("#post-list").on("click", ".post-card .toggle-comments", function () {
  const postCardElement = $(this).closest(".post-card");
  const post = postCardElement.data("post");

  setCommentsOnPost(post)
    .then(function (post) {
      console.log("building comments for the first time...", post);

      const commentListEl = postCardElement.find(".comment-list").empty();

      post.comments.forEach(function (comment) {
        commentListEl.append(`<h3>${comment.body} --- ${comment.email}</h3>`);
      });
      toggleComments(postCardElement);
    })
    .catch(function () {
      console.log("comments previously existed, only toggling...", post);
      toggleComments(postCardElement);
    });
});