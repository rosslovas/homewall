import { Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn, JoinTable } from 'typeorm';
import { Hold } from './Hold';
import { Wall } from './Wall';

@Entity()
export class Problem {
	
    @PrimaryGeneratedColumn()
	id?: number;
	
	@Column()
	name: string;

	@Column({ nullable: true })
	difficulty?: string;

	@ManyToOne(type => Wall, wall => wall.problems)
	wall?: Wall;

	@ManyToMany(type => Hold, { cascade: true })
	@JoinTable()
	holds?: Hold[];

	constructor(name: string) {
		this.name = name;
	}
	
}