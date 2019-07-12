import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Wall } from './Wall';

@Entity()
export class Hold {
	
    @PrimaryGeneratedColumn()
	id?: number;
	
	@Column()
	name: string;

	@ManyToOne(type => Wall, wall => wall.holds)
	wall?: Wall;

	constructor(name: string) {
		this.name = name;
	}
	
}
