import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Image {
	
    @PrimaryGeneratedColumn()
	id?: number;

	@CreateDateColumn()
	createdOn?: Date;

	private _data : Buffer | undefined;

	get data(): Buffer {
		if (!this._data) {
			this._data = Buffer.from(this.dataHex!, 'hex');
		}
		return this._data;
	}
	
	@Column('bytea', { nullable: false, name: 'data' })
	dataHex?: string;

	constructor(data?: Buffer) {
		if (data) {
			this.dataHex = `\\x${data.toString('hex')}`;
		}
	}

}
