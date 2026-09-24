
# Rattus Råtatår

### AKA. Pyörivä Råtta Orkesteri™

### or R.A.R. (Rotating Apparatus for Rats)
this project is very wip :)

## What does it do?

spins rats to make music :3

## How does it work?
The system infrastructure is as follows:
**Frontend** -> **Backend** -> **Serial Controller** -> Motor Controllers (5*4 A4988 drivers) -> 20 motors 

- **Serial Controller** (*python*): This one controls the motor controllers basically relaying the backend with a WebSocket. (not currently in the repo, adding later)
- **Frontend** (*react*): Sends stuff to the backend. (/packages/nezumifrontend)
- **Backend** (*express.js*): everything else. (/packages/backend)

## Hardware
Right now the råtator works using five 3D printer motherboards as motor controllers.
Right now it's designed to work with Creality v1.1.4 and v2.1 boards.

Here is the case design for the motor controllers:
![alt text](https://raw.githubusercontent.com/HassyTeam/rattus-rotator/refs/heads/main/crealityV1.1.4case.png "Controller case drawing image")


## Licensing
The code in this repository is currently under AGPL-3.0. See the LICENSE file for more information.
