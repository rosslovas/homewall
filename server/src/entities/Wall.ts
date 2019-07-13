import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Hold } from './Hold';
import { Problem } from './Problem';

@Entity()
export class Wall {
	
    @PrimaryGeneratedColumn()
	id?: number;
	
	@Column()
	name: string;

	@OneToMany(type => Hold, hold => hold.wall, { cascade: true })
	holds?: Hold[];

	@OneToMany(type => Problem, problem => problem.wall, { cascade: true })
	problems?: Problem[];

	constructor(name: string) {
		this.name = name;
	}

}
