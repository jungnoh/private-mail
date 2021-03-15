const MEMBER_NAME = [
  "운영팀",
  "장원영",
  "미야와키 사쿠라",
  "조유리",
  "최예나",
  "안유진",
  "야부키 나코",
  "권은비",
  "강혜원",
  "혼다 히토미",
  "김채원",
  "김민주",
  "이채연"
]

$("#view-close").click(() => {
  openList();
});

function openList() {
  $("#container-view").hide();
  $("#container-list").show();
}

function openDetail(id) {
  $("#container-list").hide();
  $("#container-view").show();
  $("#mail-frame").attr("src", `mail/${id}.html`);

  const mail = mailList.filter(x => x.id === id)[0];
  $(".header-author").text(MEMBER_NAME[mail.memberID]);
  $(".header-time").text(mail.time);
  $(".header-title").text(mail.title);
  $("#header-profile").attr("src", `profile/${mail.memberID}.jpg`);
}

function resetList() {
  $("#container-list").append(
    mailList.map(x => (`
    <div class="list-item" data-id="${x.id}" data-member-id="${x.memberID}">
      <img class="profile list-item-profile" src="profile/${x.memberID}.jpg" />
      <div>
        <div class="list-item-row">
          <div class="list-item-author">${MEMBER_NAME[x.memberID]}</div>
          <div class="list-item-time">${x.time}</div>
        </div>
        <div class="list-item-title">${x.title}</div>
        <div class="list-item-body">${x.bodyPreview}</div>
      </div>
    </div>
    `))
  );
  $(".list-item").click(function() {
    const mailId = $(this).attr("data-id");
    openDetail(mailId);
  });
  $("#container-view").hide();
  $("#container-list").show();
}

$(() => {
  resetList();
});

