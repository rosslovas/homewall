import React, { useCallback, useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';
import { Wall } from '../components/Wall';
import { Hold } from '../Hold';

export const CreateProblem = withRouter(({ match, history }) => {

	const [holds, setHolds] = useState<Hold[]>([]);
	const [selectedHolds, setSelectedHolds] = useState<Hold[]>([]);
	const [problemName, setProblemName] = useState('');
	const [difficulty, setDifficulty] = useState('');

	const wallId = match.params.wallId;

	const holdClicked = useCallback((hold: Hold) => {
		if (selectedHolds.includes(hold)) {
			setSelectedHolds(selectedHolds.filter(h => h !== hold));
		} else {
			setSelectedHolds([...selectedHolds, hold])
		}
	}, [selectedHolds]);

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
			const data = { problemName, difficulty, holdIds: selectedHolds.map(hold => hold.id) };
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
	}, [history, wallId, selectedHolds, problemName, difficulty]);

	return <>
		{'Problem name: '}
		<input type='text' onChange={e => setProblemName(e.target.value)}></input>
		{' Difficulty (optional): '}
		<input type='text' onChange={e => setDifficulty(e.target.value)}></input>
		{' '}
		<button onClick={saveProblem}>Save</button>
		<hr />
		<Wall interactive holds={holds} selectedHolds={selectedHolds} holdClicked={holdClicked} />
	</>;
});
