import React, { useEffect, useState } from 'react';
import { withRouter, Link, RouteComponentProps } from 'react-router-dom';

type ProblemListParams = RouteComponentProps<{ wallId: string }> & {
	trash?: boolean;
};

export const ProblemList = withRouter<ProblemListParams, React.FC<ProblemListParams>>(({ match, history, trash }) => {

	const [problems, setProblems] = useState<{
		id: number,
		name: string,
		difficulty: string,
	}[] | undefined>();

	const wallId = match.params.wallId;

	useEffect(() => {
		async function getData() {
			const response = await fetch(`/api/wall/${wallId}/problems${trash ? '/trash' : ''}`);
			const incomingProblems = await response.json();
			setProblems(incomingProblems);
		}
		getData();
	}, [wallId, trash]);

	return <>{problems
		? problems.length
			? <ul>
				{problems.map((problem, i) => (
					<li key={i}>
						<Link to={`/wall/${wallId}/problem/${problem.id}`}>
							{problem.name}{problem.difficulty ? ` (difficulty: ${problem.difficulty})` : ''}
						</Link>
					</li>
				))}
			</ul>
			: 'Nothing here.'
		: 'Loading...'}
	</>
});
