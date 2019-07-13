import React, { useEffect, useState } from 'react';
import { withRouter, Link } from 'react-router-dom';

export const ProblemList = withRouter(({ match, history }) => {

	const [problems, setProblems] = useState<{
		id: number,
		name: string,
		difficulty: string,
	}[]>([]);

	const wallId = match.params.wallId;

	useEffect(() => {
		async function getData() {
			const response = await fetch(`/api/wall/${wallId}/problems`);
			const incomingProblems = await response.json();
			setProblems(incomingProblems);
		}
		getData();
	}, [wallId]);

	return <>
		<ul>
			{problems.map((problem, i) => (
				<li key={i}>
					<Link to={`/wall/${wallId}/problem/${problem.id}`}>
						{problem.name}{problem.difficulty ? ` (difficulty: ${problem.difficulty})` : ''}
					</Link>
				</li>
			))}
		</ul>
	</>;
});
