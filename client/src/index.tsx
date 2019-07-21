import React, { useEffect, useState } from 'react';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import ReactDOM from 'react-dom';
import { Redirect, Switch, withRouter } from 'react-router';
import { LinkContainer } from 'react-router-bootstrap';
import { BrowserRouter as Router, NavLinkProps, Route } from 'react-router-dom';
import { CreateProblem } from './pages/CreateProblem';
import { CreateWall } from './pages/CreateWall';
import { NotFound } from './pages/NotFound';
import { ProblemList } from './pages/ProblemList';
import { ViewProblem } from './pages/ViewProblem';
import { WallList } from './pages/WallList';
import * as serviceWorker from './serviceWorker';
import './theme.scss';

const NavLink: React.FC<NavLinkProps & { eventKey?: string }> = props => <LinkContainer {...props}><Nav.Link eventKey={props.eventKey}>{props.children}</Nav.Link></LinkContainer>

const Navigation = withRouter(({ location }) => {

	const [activeKey, setActiveKey] = useState('');

	useEffect(() => {
		if (location.pathname === '/wall/create') {
			setActiveKey('createWall');
		} else if (/^\/(walls|wall\/\d+)$/.test(location.pathname)) {
			setActiveKey('createProblem');
		} else if (/^\/(problems(?:\/trash)?|wall\/\d+\/problem\/\d+)$/.test(location.pathname)) {
			setActiveKey('problemList');
		} else {
			setActiveKey('');
		}
	}, [location])

	return (
		<Navbar className='rounded p-0 mb-2' bg='light'>
			<Nav variant='pills' activeKey={activeKey}>
				<NavLink eventKey='createWall' to='/wall/create'>Create New Wall</NavLink>
				<NavLink eventKey='createProblem' to='/walls'>Create Problem</NavLink>
				<NavLink eventKey='problemList' to='/problems'>Problem List</NavLink>
			</Nav>
		</Navbar>
	);
});

ReactDOM.render(
	<Router>
		<>
			<Navigation />

			<Switch>
				<Redirect exact path='/' to='/problems' />
				<Route exact path='/walls' component={WallList} />
				<Route exact path='/wall/create' component={CreateWall} />
				<Route exact path='/wall/:wallId(\d+)' component={CreateProblem} />
				<Route exact path='/problems' component={ProblemList} />
				<Route exact path='/problems/trash' render={routeProps => <ProblemList {...routeProps} trash />} />
				<Route exact path='/wall/:wallId(\d+)/problem/:problemId(\d+)' component={ViewProblem} />
				<Route component={NotFound} status={404} />
			</Switch>
		</>
	</Router>,
	document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
