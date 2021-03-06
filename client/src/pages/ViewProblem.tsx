import React, { useCallback, useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { withRouter } from 'react-router-dom';
import { Wall } from '../components/Wall';
import { Hold, HoldState } from '../Hold';

export const ViewProblem = withRouter(({ match, history }) => {

	const [problem, setProblem] = useState<{
		name: string,
		difficulty?: string,
		wall: {},
		holds: Hold[],
		deletedOn: string | null
	} | undefined>(undefined);

	const [inLimbo, setInLimbo] = useState(false);

	const { wallId, problemId } = match.params;

	useEffect(() => {
		async function getData() {
			const response = await fetch(`/api/wall/${wallId}/problem/${problemId}`);
			const problem = await response.json();
			problem.holds = problem.holds
				.map((hold: { data: string }) => new Hold(JSON.parse(hold.data), HoldState.Selected));
			problem.holds.push(new Hold(JSON.parse(problem.startHold1.data), HoldState.Start));
			if (problem.startHold2) {
				problem.holds.push(new Hold(JSON.parse(problem.startHold2.data), HoldState.Start));
			}
			problem.holds.push(new Hold(JSON.parse(problem.endHold1.data), HoldState.End));
			if (problem.endHold2) {
				problem.holds.push(new Hold(JSON.parse(problem.endHold2.data), HoldState.End));
			}
			setProblem(problem);
		}

		getData();
	}, [wallId, problemId]);

	const deleteProblem = useCallback(() => {
		async function deleteProblem() {
			setInLimbo(true);
			const response = await fetch(`/api/wall/${wallId}/problem/${problemId}`, {
				method: 'DELETE',
				mode: 'cors'
			});
			if (response.ok) {
				history.push(`/problems`);
			}
			else {
				alert(`${response.status}: ${await response.text()}`);
			}
			setInLimbo(false);
		}
		deleteProblem();
	}, [setInLimbo, history, wallId, problemId]);

	const restoreProblem = useCallback(() => {
		async function restoreProblem() {
			setInLimbo(true);
			const response = await fetch(`/api/wall/${wallId}/problem/${problemId}/restore`, {
				method: 'POST',
				mode: 'cors'
			});
			if (response.ok) {
				setProblem({ ...problem, deletedOn: null } as typeof problem);
			}
			else {
				alert(`${response.status}: ${await response.text()}`);
			}
			setInLimbo(false);
		}
		restoreProblem();
	}, [setInLimbo, wallId, problemId, problem]);

	return problem ? <>
		<Form inline className='mb-1'>
			<Form.Label className='mx-1'>
				Problem: {problem.name}{problem.difficulty ? `, difficulty: ${problem.difficulty}` : ''}
			</Form.Label>
			{inLimbo
				? <Button variant='outline-secondary'>...</Button>
				: problem.deletedOn == null
					? <Button variant='outline-danger' onClick={deleteProblem}>Delete</Button>
					: <Button variant='outline-success' onClick={restoreProblem}>Restore</Button>}
		</Form>
		<Wall interactive={false} imageSrc={`/api/wall/${wallId}/image`} holds={problem.holds} />
	</> : <></>;
});
