# Agenda 

This project is a proof of concept of Calendar agenda  like "Calendy"  .


This project has a "Agenda.sol" contract on you canc reate appointments and invite other address to this appointmens .



# Tests
 
 To run the test execute 
 
 ```shell
 npm run test
 ```


Actual test use cases coverage status 

```shell
 Agenda
    Schedule
      ✔ Should schedule some appointment (70ms)
      ✔ Should fails on schedule from date is bigger than to (43ms)
    Unschedule
      ✔ Should unschedule some appointment (40ms)
      ✔ Should fails on unschedule some invalid appointment
      ✔ Should fails on unschedule some appointment that is not yours
    Invite
      ✔ Should fails on invite more people into appointment that is not yours
      ✔ Should fails on invite more people into past appointment
      ✔ Should fails on invite more people into invalid appointment
    Uninvite
      ✔ Should uninvite people from existing appointment (53ms)
      ✔ Should fails on uninvite people from past appointment (41ms)
      ✔ Should fails on uninvite people from invalid appointment
    Move appointment
      ✔ Should moves to other time
      ✔ Should fails on moves from is bigger than to
    Approve
      ✔ Should approve an invitation for appointment (40ms)
      ✔ Should fails on approve an invitation for invalid appointment
    Deny
      ✔ Should deny an invitation for appointment (45ms)
      ✔ Should fails on deny an invitation for invalid appointment
    Fetch
      ✔ Should fetch the appointment by Id 
      ✔ Should fails on fetch the appointment by Id and no exist 

  Invite
    Invite
      ✔ Should invite more people into existing appointment
    Approve
      ✔ Should approve an invitation for appointment
      ✔ Should fails on deny an invitation when is not yours
    Deny
      ✔ Should deny an invitation for appointment
      ✔ Should fails on approve an invitation when is not yours


  24 passing (2s)
```

-------------|----------|----------|----------|----------|----------------|
File         |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
-------------|----------|----------|----------|----------|----------------|
 contracts/  |      100 |       90 |      100 |      100 |                |
  Agenda.sol |      100 |     87.5 |      100 |      100 |                |
  Invite.sol |      100 |      100 |      100 |      100 |                |
-------------|----------|----------|----------|----------|----------------|
All files    |      100 |       90 |      100 |      100 |                |
-------------|----------|----------|----------|----------|----------------|
