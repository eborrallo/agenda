//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Invite {

    event MemberInvited(uint indexed _appointmentId, uint indexed _invitationId, address indexed _member);
    event MemberUninvited(uint indexed _appointmentId, uint indexed _invitationId, address indexed _member);
    event InvitationApproved(uint indexed _appointmentId, uint indexed _invitationId, address indexed _member);
    event InvitationDenied(uint indexed _appointmentId, uint indexed _invitationId, address indexed _member);

    uint numOfInvitations;
    mapping(uint => Invitation) private invitations;
    enum Status{PENDING, ACCEPTED, DENIED}

    struct Invitation {
        address member;
        Status status;
        uint appointmentId;
    }

    constructor() {
        numOfInvitations = 0;
    }

    function invite(uint id, address[] memory members) public {
        for (uint i = 0; i < members.length; i++) {
            numOfInvitations++;
            invitations[numOfInvitations] = Invitation(members[i], Status.PENDING, id);
            emit MemberInvited(id, numOfInvitations, members[i]);
        }
    }

    function uninvite(uint appointmentId, uint invitationId, address[] memory members) public {
        for (uint i = 0; i < members.length; i++) {
            delete invitations[numOfInvitations];
            emit MemberUninvited(appointmentId, invitationId, members[i]);
        }
    }

    function approve(uint appointmentId, uint invitationId) public {
        require(invitations[invitationId].member == msg.sender, 'This is not your invitation');
        invitations[invitationId].status = Status.ACCEPTED;
        emit InvitationApproved(appointmentId, invitationId, msg.sender);
    }

    function deny(uint appointmentId, uint invitationId) public {
        require(invitations[invitationId].member == msg.sender, 'This is not your invitation');
        invitations[invitationId].status = Status.DENIED;
        emit InvitationDenied(appointmentId, invitationId, msg.sender);
    }

}
