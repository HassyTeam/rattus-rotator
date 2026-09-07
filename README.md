
# Rattus Råtatår

### AKA. Pyörivä Råtta Orkesteri™

### or R.A.R. (Rotating Apparatus for Rats)
this project is very wip :)

## What does it do?

spins rats to make music :3

## How does it work?
The system infrastructure is as follows:
**Frontend** -> **Backend** -> **Serial Controller** -> Motor Controllers (4*5 A4988 drivers) -> 20 motors 

- **Serial Controller** (*python*): This one controls the motor controllers basically relaying the backend with a WebSocket. (not currently in the repo, adding later)
- **Frontend** (*react*): Sends stuff to the backend. (/packages/nezumifrontend)
- **Backend** (*express.js*): everything else. (/packages/backend)

## Licensing
The code in this repository is currently under AGPL-3.0. See the LICENSE file for more information.
