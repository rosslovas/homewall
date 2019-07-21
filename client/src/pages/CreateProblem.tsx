import React, { useCallback, useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';
import { Wall } from '../components/Wall';
import { Hold, HoldState } from '../Hold';

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

function countHolds(holds: Hold[]) {
	let startHoldCount = 0;
	let endHoldCount = 0;
	for (const h of holds) {
		if (h.state === HoldState.Start) {
			++startHoldCount;
		} else if (h.state === HoldState.End) {
			++endHoldCount;
		}
	}
	return { startHoldCount, endHoldCount };
}

export const CreateProblem = withRouter(({ match, history }) => {

	const [holds, setHolds] = useState<Hold[]>([]);
	const [problemName, setProblemName] = useState('');
	const [difficulty, setDifficulty] = useState('');

	const wallId = match.params.wallId;

	const holdClicked = useCallback((hold: Hold) => {
		

		if (hold.state === HoldState.Unselected) {
			hold.state = HoldState.Selected;
		} else if (hold.state === HoldState.Selected) {
			const { startHoldCount, endHoldCount } = countHolds(holds);
			if (startHoldCount < 2) {
				hold.state = HoldState.Start;
			} else if (endHoldCount < 2) {
				hold.state = HoldState.End;
			} else {
				hold.state = HoldState.Unselected;
			}
		} else if (hold.state === HoldState.Start) {
			const { endHoldCount } = countHolds(holds);
			if (endHoldCount < 2) {
				hold.state = HoldState.End;
			} else {
				hold.state = HoldState.Unselected;
			}
		} else if (hold.state === HoldState.End) {
			hold.state = HoldState.Unselected;
		}
		setHolds([...holds]);
	}, [holds]);

	useEffect(() => {
		async function getData() {
			const response = await fetch(`/api/wall/${wallId}`);
			const wall = await response.json();
			const incomingHolds = wall.holds.map((hold: any) => {
				const newHold = new Hold(JSON.parse(hold.data));
				newHold.id = hold.id;
				return newHold;
			});
			setHolds(incomingHolds);
		}
		getData();
	}, [wallId]);

	const saveProblem = useCallback((e: React.FormEvent) => {
		async function saveProblem() {
			const startHoldIds: (number | undefined)[] = [];
			const endHoldIds: (number | undefined)[] = [];
			const otherHoldIds: (number | undefined)[] = [];
			for (const hold of holds) {
				if (hold.state === HoldState.Start) {
					startHoldIds.push(hold.id);
				} else if (hold.state === HoldState.End) {
					endHoldIds.push(hold.id);
				} else if (hold.state === HoldState.Selected) {
					otherHoldIds.push(hold.id);
				}
			}

			const data = {
				problemName,
				difficulty,
				holdIds: otherHoldIds,
				startHold1Id: startHoldIds[0],
				startHold2Id: startHoldIds[1],
				endHold1Id: endHoldIds[0],
				endHold2Id: endHoldIds[1]
			};
			console.log(data);
			const response = await fetch(`/api/wall/${wallId}/problems`, {
				method: 'POST',
				mode: 'cors',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});
			if (response.ok) {
				const problemId = await response.json();
				history.push(`/wall/${wallId}/problem/${problemId}`);
			}
			else {
				alert(`${response.status}: ${await response.text()}`);
			}
		}
		saveProblem();
		e.preventDefault();
	}, [history, wallId, holds, problemName, difficulty]);

	return <>
		<Form inline className='mb-1' onSubmit={saveProblem}>
			<Form.Group controlId='problemName'>
				<Form.Label className='mx-1'>Problem name:</Form.Label>
				<Form.Control required className='mr-1' placeholder='Problem name' onChange={(e: any) => setProblemName(e.target.value)}></Form.Control>
			</Form.Group>
			<Form.Group controlId='difficulty'>
				<Form.Label className='mx-1'>Difficulty (optional):</Form.Label>
				<Form.Control className='mr-1' placeholder='Difficulty' onChange={(e: any) => setDifficulty(e.target.value)}></Form.Control>
			</Form.Group>
			<Button className='ml-1' type='submit' variant='outline-success'>Save</Button>
		</Form>
		<Wall interactive imageSrc={`/api/wall/${wallId}/image`} holds={holds} holdClicked={holdClicked} />
	</>;
});
