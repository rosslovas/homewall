import React, { useEffect, useState } from 'react';
import { Link, withRouter } from 'react-router-dom';

export const WallList = withRouter(({ history }) => {

	const [walls, setWalls] = useState<{
		id: number,
		name: string
	}[] | undefined>();

	useEffect(() => {
		async function getData() {
			const response = await fetch('/api/walls');
			const incomingWalls = await response.json();
			setWalls(incomingWalls);
		}
		getData();
	}, []);

	return <>{walls
		? walls.length
			? <>
				{walls.map((wall) => <div>
					<Link to={`/wall/${wall.id}`}>{wall.name}</Link>
				</div>)}
			</>
			: 'Nothing here.'
		: 'Loading...'}
	</>
});
