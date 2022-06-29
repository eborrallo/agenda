//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Agenda {
    event AppointmentCreated(uint _id, address indexed _creator, uint  indexed _from, uint  indexed _to);
    event AppointmentUnscheduled(uint _id, address indexed _owner);
    event AppointmentMoved(uint indexed _id, uint _from, uint  indexed _to);
    event MemberInvited(uint indexed _appointmentId, uint indexed _invitationId, address indexed _member);
    event InvitationApproved(uint indexed _invitationId, address indexed _member);
    event InvitationDenied(uint indexed _invitationId, address indexed _member);
    event MemberUninvited(uint indexed _appointmentId, address indexed _member);

    uint numOfAppointments;
    uint numOfInvitations;

    mapping(uint => Appointment) private listAppointments;
    mapping(address => uint[]) private appointmentsByAddress;
    mapping(uint => Invitation) private invitations;

    modifier appointmentExist(uint id) {
        require(listAppointments[id].owner != address(0), 'Appointment does not exist');
        _;
    }
    modifier onlyOwner(uint id)  {
        require(listAppointments[id].owner != address(0), 'Appointment does not exist');
        require(listAppointments[id].owner == msg.sender, 'Appointment is not yours');
        _;
    }
    modifier dateFormatTimeline(uint id) {
        require(listAppointments[id].from < listAppointments[id].to, 'Date From must be bigger than To');
        _;
    }
    modifier lockPast(uint id) {
        require(listAppointments[id].from > block.timestamp && listAppointments[id].to > block.timestamp, 'Edit past appointments is not allowed');
        _;
    }
    enum Status{PENDING, ACCEPTED, DENIED}

    struct Appointment {
        uint from;
        uint to;
        address owner;
        uint[] invitations;
    }

    struct Invitation {
        address member;
        Status status;
    }
    constructor() {
        numOfAppointments = 0;
        numOfInvitations = 0;
    }

    function schedule(uint from, uint to, address[] memory members, bool visible) public {
        require(from < to, 'Date From must be bigger than To');
        numOfAppointments++;

        listAppointments[numOfAppointments].from = from;
        listAppointments[numOfAppointments].to = to;
        listAppointments[numOfAppointments].owner = msg.sender;
        appointmentsByAddress[msg.sender].push(numOfAppointments);

        emit AppointmentCreated(numOfAppointments, msg.sender, from, to);

        _invite(numOfAppointments, members);

    }

    function appointments(address from) external view returns (Appointment[] memory) {
        uint numOfAppointmentsForAddress = appointmentsByAddress[from].length;
        Appointment[] memory _appointments = new Appointment[](numOfAppointments);
        for (uint i = 0; i < numOfAppointmentsForAddress; i++) {
            _appointments[i] = listAppointments[appointmentsByAddress[from][i]];
        }
        return _appointments;
    }

    function appointment(uint id) external view returns (Appointment memory) {
        return listAppointments[id];
    }

    function _invite(uint id, address[] memory members) private {
        for (uint i = 0; i < members.length; i++) {
            numOfInvitations++;
            invitations[numOfInvitations] = Invitation(members[i], Status.PENDING);
            listAppointments[id].invitations.push(numOfInvitations);
            appointmentsByAddress[members[i]].push(id);
            emit MemberInvited(id, numOfInvitations, members[i]);
        }
    }

    function invite(uint id, address[] memory members) public onlyOwner(id) lockPast(id) {
        _invite(id, members);
    }

    function unschedule(uint id) public onlyOwner(id) {

        delete listAppointments[id];
        for (uint i = 0; i < appointmentsByAddress[msg.sender].length; i++) {
            if (appointmentsByAddress[msg.sender][i] == id) {
                delete appointmentsByAddress[msg.sender][i];
            }
        }
        emit AppointmentUnscheduled(id, msg.sender);
    }

    function uninvite(uint id, address[] memory members) public onlyOwner(id) dateFormatTimeline(id) lockPast(id) {
        uint[] memory _invitations = listAppointments[id].invitations;

        for (uint i = 0; i < members.length; i++) {
            for (uint j = 0; j < _invitations.length; j++) {
                uint invitationId = listAppointments[id].invitations[j];
                if (invitations[invitationId].member == members[i]) {
                    delete invitations[invitationId];
                    delete listAppointments[id].invitations[j];

                    emit MemberUninvited(id, members[i]);
                }

            }
        }
    }

    function move(uint id, uint from, uint to) public onlyOwner(id) dateFormatTimeline(id) lockPast(id) {
        require(from > block.timestamp && to > block.timestamp, 'Dates must be bigger than now');
        require(from < to, 'Date To must be bigger than From');

        listAppointments[id].from = from;
        listAppointments[id].to = to;
        emit AppointmentMoved(id, from, to);
    }

    function approve(uint invitationId, uint id) public appointmentExist(id) dateFormatTimeline(id) lockPast(id) {
        require(invitations[invitationId].member == msg.sender, 'This is not your invitation');
        invitations[invitationId].status = Status.ACCEPTED;
        emit InvitationApproved(id, msg.sender);

    }

    function deny(uint invitationId, uint id) public appointmentExist(id) dateFormatTimeline(id) lockPast(id) {
        require(invitations[invitationId].member == msg.sender, 'This is not your invitation');
        invitations[invitationId].status = Status.DENIED;
        emit InvitationDenied(id, msg.sender);

    }

}
