import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Hold } from './Hold';
import { Image } from './Image';
import { Problem } from './Problem';

@Entity()
export class Wall {
	
    @PrimaryGeneratedColumn()
	id?: number;

	@CreateDateColumn()
	createdOn?: Date;
	
	@Column()
	name: string;

	@OneToOne(type => Image, { nullable: false, cascade: true, onDelete: 'CASCADE' })
	@JoinColumn()
	image: Image;

	@OneToMany(type => Hold, hold => hold.wall, { cascade: true })
	holds?: Hold[];

	@OneToMany(type => Problem, problem => problem.wall, { cascade: true })
	problems?: Problem[];

	constructor(name: string, image: Image) {
		this.name = name;
		this.image = image;
	}

}
