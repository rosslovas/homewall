import React, { useEffect, useState } from 'react';
import { Link, RouteComponentProps, withRouter } from 'react-router-dom';

type ProblemListParams = RouteComponentProps<{ wallId: string }> & {
	trash?: boolean;
};

export const ProblemList = withRouter<ProblemListParams, React.FC<ProblemListParams>>(({ match, history, trash }) => {

	const [walls, setWalls] = useState<{
		id: number,
		name: string,
		problems: {
			id: number,
			name: string,
			difficulty: string,
		}[]
	}[] | undefined>();

	useEffect(() => {
		async function getData() {
			const response = await fetch(`/api/problems${trash ? '/trash' : ''}`);
			const incomingWalls = await response.json();
			setWalls(incomingWalls);
		}
		getData();
	}, [trash]);

	return <>{walls
		? walls.length
			? <>
				{walls.map((wall) => <>
					<h3>{wall.name}</h3>
					<ul>
						{wall.problems.map((problem, i) => (
							<li key={i}>
								<Link to={`/wall/${wall.id}/problem/${problem.id}`}>
									{problem.name}{problem.difficulty ? ` (difficulty: ${problem.difficulty})` : ''}
								</Link>
							</li>
						))}
					</ul>
				</>)}
			</>
			: 'Nothing here.'
		: 'Loading...'}
	</>
});
