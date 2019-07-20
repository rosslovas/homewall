import React, { useCallback, useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';
import { Wall } from '../components/Wall';
import { Hold, HoldState } from '../Hold';

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

	const saveProblem = useCallback(() => {
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
	}, [history, wallId, holds, problemName, difficulty]);

	return <>
		{'Problem name: '}
		<input type='text' onChange={e => setProblemName(e.target.value)}></input>
		{' Difficulty (optional): '}
		<input type='text' onChange={e => setDifficulty(e.target.value)}></input>
		{' '}
		<button onClick={saveProblem}>Save</button>
		<hr />
		<Wall interactive imageSrc={`/api/wall/${wallId}/image`} holds={holds} holdClicked={holdClicked} />
	</>;
});
