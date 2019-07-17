import React from 'react';
import ReactDOM from 'react-dom';
import { Redirect, Switch } from 'react-router';
import { BrowserRouter as Router, Link, Route } from 'react-router-dom';
import './index.css';
import { CreateProblem } from './pages/CreateProblem';
import { CreateWall2 } from './pages/CreateWall2';
import { NotFound } from './pages/NotFound';
import { ProblemList } from './pages/ProblemList';
import { ViewProblem } from './pages/ViewProblem';
import { WallList } from './pages/WallList';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(
	<Router>
		<div>
			<Link to='/walls'>Create Problem</Link>
			{' / '}
			<Link to='/problems'>Problem List</Link>

			<hr />

			<Switch>
				<Redirect exact path='/' to='/wall/1' />
				<Route exact path='/walls' component={WallList} />
				<Route exact path='/wall/create' component={CreateWall2} />
				<Route exact path='/wall/:wallId(\d+)' component={CreateProblem} />
				<Route exact path='/problems' component={ProblemList} />
				<Route exact path='/problems/trash' render={routeProps => <ProblemList {...routeProps} trash />} />
				<Route exact path='/wall/:wallId(\d+)/problem/:problemId(\d+)' component={ViewProblem} />
				<Route component={NotFound} status={404} />
			</Switch>
		</div>
	</Router>,
	document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
