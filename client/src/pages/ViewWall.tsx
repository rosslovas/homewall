import React, { useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router';
import { Wall } from '../components/Wall';
import { Hold } from '../Hold';

export const ViewWall: React.FC<RouteComponentProps<{ id: string; }>> = ({ match }) => {
	const [holds, setHolds] = useState<Hold[]>([]);

	const id = match.params.id;

	useEffect(() => {
		async function getData() {
			const response = await fetch(`http://localhost:9000/api/wall/${id}`);
			const wall = await response.json();
			const incomingHolds = wall.holds.map((hold: any) => {
				const newHold = new Hold(JSON.parse(hold.data));
				newHold.id = hold.id;
				return newHold;
			});
			setHolds(incomingHolds);
		}

		getData();
	}, [id]);

	return <Wall holds={holds} />;
}
