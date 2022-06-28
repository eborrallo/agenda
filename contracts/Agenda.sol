//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Agenda {
    event AppointmentCreated(uint _id, address indexed _creator, uint  indexed _from, uint  indexed _to);
    event MemberInvited(uint indexed _appointmentId, address indexed _member);
    enum Status{PENDING, ACCEPTED, DENIED}
    uint numOfAppointments;
    mapping(uint => Appointment) private listAppointments;
    mapping(address => uint[]) private appointmentsByAddress;

    struct Appointment {
        uint from;
        uint to;
        address owner;
        address[] members;
        Status status;
    }
    constructor() {
        numOfAppointments = 0;
    }

    function schedule(uint from, uint to, address[] memory members, bool visible) public {
        require(from < to, 'Date From must be bigger than To');
        numOfAppointments++;
        Appointment memory ap = Appointment(from, to, msg.sender, members, Status.ACCEPTED);
        listAppointments[numOfAppointments] = ap;
        appointmentsByAddress[msg.sender].push(numOfAppointments);
        emit AppointmentCreated(numOfAppointments, msg.sender, from, to);
    }

    function appointments(address from) external view returns (Appointment[] memory) {
        uint numOfAppointmentsForAddress = appointmentsByAddress[from].length;
        Appointment[] memory _appointments = new Appointment[](numOfAppointments);
        for (uint i = 0; i < numOfAppointmentsForAddress; i++) {
            _appointments[i] = listAppointments[appointmentsByAddress[from][i]];
        }
        return _appointments;
    }

    function invite(uint id, address[] memory members) public {
        require(listAppointments[id].owner != address(0), 'Appointment does not exist');
        require(listAppointments[id].from < listAppointments[id].to, 'Date From must be bigger than To');
        require(listAppointments[id].from > block.timestamp && listAppointments[id].to > block.timestamp, 'Dates must be bigger than now');
        console.log(listAppointments[id].from > block.timestamp);
        console.log(block.timestamp);
        for (uint i = 0; i < members.length; i++) {
            listAppointments[id].members.push(members[i]);
            emit MemberInvited(id, members[i]);
        }
    }

}
