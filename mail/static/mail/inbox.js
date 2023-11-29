document.addEventListener('DOMContentLoaded', function () {
  console.log('Content loaded');
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  console.log('LOADING MAILBOX FIRED:', mailbox);

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'flex';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //Get mails from specific folder
  request('GET', `/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      console.log('emails:', emails);

      emails.forEach((email) => {
        const emailDiv = document.createElement('div');
        emailDiv.className = `list-group-item email-body ${email.read ? '' : 'unread'}`;
        emailDiv.innerHTML = `
          <p>${email.sender}</p>
          <p>${email.subject}</p>
          <p>${email.timestamp}</p>
          
      `;
        emailDiv.addEventListener('click', () => view_email(email.id));
        document.querySelector('#emails-view').append(emailDiv);
      });
    });
}

function send_email(e) {
  console.log('SEND EMAIL FIRED:', e);

  e.preventDefault();
  const recipients = e.target[1].value;
  const subject = e.target[2].value;
  const body = e.target[3].value;

  request('POST', '/emails', {
    recipients,
    subject,
    body,
  }).then((response) => {
    console.log(response);
    load_mailbox('sent');
  });
}

function view_email(id) {
  console.log(id);
  request('GET', `/emails/${id}`)
    .then((response) => response.json())
    .then((email) => {
      //Removing last opened email from DOM
      const emailViewContainer = document.querySelector('#email-view');
      emailViewContainer.removeChild(emailViewContainer.firstChild);
      //
      console.log(email);
      const emailDiv = document.createElement('div');
      emailDiv.innerHTML = `
        <p><strong>From: </strong>${email.sender}</p>
        <p><strong>To: </strong>${email.recipients}</p>
        <p><strong>Subject: </strong>${email.subject}</p>
        <p><strong>Timestamp: </strong>${email.timestamp}</p>
        <div class="button-wrapper"></div>
        <hr />
        <p>${email.body}</p>
      `;
      emailDiv.className = 'list-group-item email-body';

      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#email-view').style.display = 'block';
      document.querySelector('#email-view').append(emailDiv);

      //Adding reply button
      const replyButton = document.createElement('button');
      replyButton.className = `btn btn-sm btn-outline-primary`;
      replyButton.innerHTML = 'Reply';
      replyButton.addEventListener('click', () => {
        compose_email();
        document.querySelector('#compose-recipients').value = email.sender;
        let subject = email.subject;
        if ( subject.split(' ')[0] === 'Re:' ) {
          subject = subject.split(' ')[1];
        }
        document.querySelector('#compose-subject').value = subject;
        document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
      });

      //Adding archive button
      const wrapper = document.querySelector('.button-wrapper');
      const archiveButton = document.createElement('button');
      archiveButton.className = `btn btn-sm ${email.archived ? 'btn-info' : 'btn-success'}`;
      archiveButton.innerHTML = email.archived ? 'Unarchive' : 'Archive';
      archiveButton.addEventListener('click', () => {
        request('PUT', `/emails/${id}`, {
          archived: !email.archived,
        }).then((response) => {
          console.log(response);
          load_mailbox('inbox');
        });
      });
      //Adding delete button
      // const deleteButton = document.createElement('button');
      // deleteButton.className = `btn btn-sm btn-outline-danger`;
      // deleteButton.innerHTML = 'Delete';
      // deleteButton.addEventListener('click', () => {
      //   request('DELETE', `/emails/${id}`).then((response) => {
      //     console.log(response);
      //     load_mailbox('inbox');
      //   });
      // });
      //
      wrapper.append(replyButton, archiveButton);

      // Mark email as read
      if (!email.read) {
        request('PUT', `/emails/${id}`, {
          read: true,
        });
      }
    });
}

function request(method, url, data) {
  console.log('REQUEST FUNCTION FIRED:', method, url, data);
  if (method === 'GET') {
    console.log('GET REQUEST FIRED');
    return fetch(url, {
      method,
    });
  } else {
    console.log('POST REQUEST FIRED');
    return fetch(url, {
      method,
      body: JSON.stringify({
        ...data,
      }),
    });
  }
}

//TODO:
//Just a small suggestion, to display the email you could have just changed the innerHTML  of emails-view and not create a new div.
// Use async/await for the  API calls as it is a more efficient way to do it.
// For the Reply, no conditional is needed, look into the .replace method in MDN web docs
// Do not show Archive/Unarchive button in SENT box
