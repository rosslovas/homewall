import React, { useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';
import { Wall } from '../components/Wall';
import { Hold } from '../Hold';

export const ViewProblem = withRouter(({ match, history }) => {

	const [problem, setProblem] = useState<{
		name: string,
		difficulty?: string,
		wall: {},
		holds: Hold[]
	} | undefined>(undefined);

	const { wallId, problemId } = match.params;

	useEffect(() => {
		async function getData() {
			const response = await fetch(`http://192.168.1.100:9000/api/wall/${wallId}/problem/${problemId}`);
			const problem = await response.json();
			problem.holds = problem.holds
				.map((hold: { data: string }) => new Hold(JSON.parse(hold.data)));
			setProblem(problem);
		}

		getData();
	}, [wallId, problemId]);

	return problem ? <>
		Problem name: {problem.name}{problem.difficulty ? `, difficulty: ${problem.difficulty}` : ''}
		<hr />
		<Wall interactive={false} holds={problem.holds} selectedHolds={problem.holds} />
	</> : <></>;
});
