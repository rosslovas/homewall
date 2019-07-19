import { Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn, JoinTable, CreateDateColumn } from 'typeorm';
import { Hold } from './Hold';
import { Wall } from './Wall';

@Entity()
export class User {
	
    @PrimaryGeneratedColumn()
	id?: number;
	
	@Column({ nullable: false })
	username!: string;

	@Column({ nullable: false })
	passwordHash!: string;

	constructor(init: { username: string, passwordHash: string }) {
		if (init) { Object.assign(this, init); }
	}
	
}
