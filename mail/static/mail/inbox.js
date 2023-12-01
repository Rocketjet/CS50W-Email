document.addEventListener('DOMContentLoaded', function () {
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function request(method, url, data) {
  if (method === 'GET') {
    return fetch(url, {
      method,
    });
  } else {
    return fetch(url, {
      method,
      body: JSON.stringify({
        ...data,
      }),
    });
  }
}

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

async function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  const emailsView = document.querySelector('#emails-view');
  emailsView.style.display = 'flex';
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //Get mails from specific folder
  const response = await request('GET', `/emails/${mailbox}`);
  const result = await response.json();

  if (result.error) {
    const emailDiv = document.createElement('div');
    emailDiv.innerHTML = `
      <h5>Sorry, there was an error: ${result.error}</h5>
    `;
    emailsView.append(emailDiv);
    return;
  }

  result.forEach((email) => {
    const emailDiv = document.createElement('div');
    emailDiv.className = `list-group-item email-body ${email.read ? '' : 'unread'}`;
    emailDiv.innerHTML = `
      <p>${email.sender}</p>
      <p>${email.subject}</p>
      <p>${email.timestamp}</p>
    `;
    emailDiv.addEventListener('click', () => view_email(email.id, mailbox));
    emailsView.append(emailDiv);
  });
}

async function send_email(e) {
  e.preventDefault();
  const recipients = e.target[1].value;
  const subject = e.target[2].value;
  const body = e.target[3].value;

  const response = await request('POST', '/emails', {
    recipients,
    subject,
    body,
  });
  const result = await response.json();

  if (result.error) {
    alert(result.error);
  } else load_mailbox('sent');
}

async function view_email(id, mailbox) {

  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';
  const emailViewContainer = document.querySelector('#email-view');

  // Removing last opened email from DOM
  emailViewContainer.removeChild(emailViewContainer.firstChild);
  
  const emailDiv = document.createElement('div');
  emailViewContainer.append(emailDiv);

  //Get email
  const response = await request('GET', `/emails/${id}`);
  const result = await response.json();

  if (result.error) {
    emailDiv.innerHTML = `
      <h5>Sorry, there was an error: ${result.error}</h5>
    `;
    return;
  }

  const email = result;
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

  const wrapper = document.querySelector('.button-wrapper');
  //Adding reply button
  const replyButton = document.createElement('button');
  replyButton.className = `btn btn-sm btn-outline-primary`;
  replyButton.innerHTML = 'Reply';
  replyButton.addEventListener('click', () => {
    compose_email();
    document.querySelector('#compose-recipients').value = email.sender;
    let subject = email.subject;
    if (subject.split(' ')[0] === 'Re:') {
      subject = subject.split(' ')[1];
    }
    document.querySelector('#compose-subject').value = subject;
    document.querySelector('#compose-body').value = `<< On ${email.timestamp} ${email.sender} wrote: ${email.body} >>\n`;
  });

  //Adding archive button
  const archiveButton = document.createElement('button');
  archiveButton.className = `btn btn-sm ${email.archived ? 'btn-info' : 'btn-success'}`;
  archiveButton.innerHTML = email.archived ? 'Unarchive' : 'Archive';
  archiveButton.addEventListener('click', () => {
    request('PUT', `/emails/${id}`, {
      archived: !email.archived,
    }).then((response) => load_mailbox('inbox'));
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
  if (mailbox !== 'sent') {
    wrapper.append(replyButton, archiveButton);
  } else wrapper.append(replyButton);

  // Mark email as read
  if (!email.read) {
    request('PUT', `/emails/${id}`, {
      read: true,
    });
  }
}
