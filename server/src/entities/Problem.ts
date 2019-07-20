import { Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn, JoinTable, CreateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Hold } from './Hold';
import { Wall } from './Wall';

@Entity()
export class Problem {
	
    @PrimaryGeneratedColumn()
	id?: number;

	@CreateDateColumn()
	createdOn?: Date;

	@Column({ nullable: true })
	deletedOn?: Date;
	
	@Column()
	name!: string;

	@Column({ nullable: true })
	difficulty?: string;

	@ManyToOne(type => Wall, wall => wall.problems)
	wall?: Wall;

	@ManyToOne(type => Hold, { nullable: false })
	@JoinColumn()
	startHold1!: Hold;

	@ManyToOne(type => Hold, { nullable: true })
	@JoinColumn()
	startHold2?: Hold;

	@ManyToOne(type => Hold, { nullable: false })
	@JoinColumn()
	endHold1!: Hold;

	@ManyToOne(type => Hold, { nullable: true })
	@JoinColumn()
	endHold2?: Hold;

	@ManyToMany(type => Hold, { cascade: true })
	@JoinTable()
	holds?: Hold[];

	constructor(init: {
		name: string,
		difficulty?: string,
		wall?: Wall,
		startHold1: Hold,
		startHold2?: Hold,
		endHold1: Hold,
		endHold2?: Hold,
		holds?: Hold[]
	}) {
		if (init) { Object.assign(this, init); }
	}
	
}
