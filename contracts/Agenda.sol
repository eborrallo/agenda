//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Invite.sol";

contract Agenda is Invite {
    event AppointmentCreated(uint _id, address indexed _creator, uint  indexed _from, uint  indexed _to);
    event AppointmentUnscheduled(uint _id, address indexed _owner);
    event AppointmentMoved(uint indexed _id, uint _from, uint  indexed _to);

    uint numOfAppointments;
    mapping(uint => Appointment) private listAppointments;

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

    struct Appointment {
        uint from;
        uint to;
        address owner;
    }

    constructor() {
        numOfAppointments = 0;
    }

    function schedule(uint from, uint to, address[] memory members, bool visible) external {
        require(from < to, 'Date From must be bigger than To');
        numOfAppointments++;

        listAppointments[numOfAppointments].from = from;
        listAppointments[numOfAppointments].to = to;
        listAppointments[numOfAppointments].owner = msg.sender;

        emit AppointmentCreated(numOfAppointments, msg.sender, from, to);

        super.invite(numOfAppointments, members);
    }

    function appointment(uint id) appointmentExist(id) external view returns (Appointment memory)   {
        return listAppointments[id];
    }

    function inviteMembers(uint id, address[] memory members) public onlyOwner(id) lockPast(id) {
        return super.invite(id, members);
    }

    function uninviteMembers(uint appointmentId, uint invitationId, address[] memory members) public onlyOwner(appointmentId) lockPast(appointmentId) {
        return super.uninvite(appointmentId, invitationId, members);
    }

    function approveInvite(uint appointmentId, uint invitationId) public appointmentExist(appointmentId) dateFormatTimeline(appointmentId) lockPast(appointmentId) {
        super.approve(appointmentId, invitationId);
    }

    function denyInvite(uint appointmentId, uint invitationId) public appointmentExist(appointmentId) dateFormatTimeline(appointmentId) lockPast(appointmentId) {
        super.deny(appointmentId, invitationId);
    }

    function unschedule(uint id) public onlyOwner(id) {

        delete listAppointments[id];
        emit AppointmentUnscheduled(id, msg.sender);
    }

    function move(uint id, uint from, uint to) public onlyOwner(id) dateFormatTimeline(id) lockPast(id) {
        require(from > block.timestamp && to > block.timestamp, 'Dates must be bigger than now');
        require(from < to, 'Date To must be bigger than From');

        listAppointments[id].from = from;
        listAppointments[id].to = to;
        emit AppointmentMoved(id, from, to);
    }

}
