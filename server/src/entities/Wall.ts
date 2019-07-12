import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Hold } from './Hold';

@Entity()
export class Wall {
	
    @PrimaryGeneratedColumn()
	id?: number;
	
	@Column()
	name: string;

	@OneToMany(type => Hold, hold => hold.wall, { cascade: true })
	holds?: Hold[];

	constructor(name: string) {
		this.name = name;
	}

}
