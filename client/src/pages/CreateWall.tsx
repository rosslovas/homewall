import React, { useCallback, useEffect, useRef, useState } from 'react';
import { withRouter } from 'react-router';
import { Hold } from '../Hold';
import { Point } from '../Point';

function readBlobAsDataURL(blob: Blob) {
    const fileReader = new FileReader();

    return new Promise<string>((resolve, reject) => {

        fileReader.onerror = () => {
            fileReader.abort();
            reject(new Error('Problem parsing input file.'));
        };

        fileReader.onload = () => resolve(fileReader.result as string);

        fileReader.readAsDataURL(blob);
    });
}

function loadImage(image: HTMLImageElement, src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        image.onerror = () => reject(new Error('Problem loading image.'));
        image.onload = () => resolve(image);
        image.src = src;
    });
}

export const CreateWall = withRouter(({ match, history }) => {

	const [imageChosen, setImageChosen] = useState(false);
	const [loadingImage, setLoadingImage] = useState(false);
	const [wallDimensions, setWallDimensions] = useState<{ width: number, height: number } | undefined>(undefined);
	const [holds, setHolds] = useState<Hold[]>([]);
	const [wallName, setWallName] = useState('');
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');

	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const imageRef = useRef<HTMLImageElement | null>(null);
	
	const loadImageFromFile = useCallback(async () => {
		async function loadImageFromFile() {
			const input = fileInputRef.current;
			const image = imageRef.current;

			if (!input || !image) {
				return;
			}

			if (!input.files || !input.files[0]) {
				input.value = '';
				return;
			}

			const file = input.files[0];
			if ((file.type !== 'image/jpeg' && file.type !== 'image/jpg') || file.size < 107) {
				alert('File must be a JPEG image');
				input.value = '';
				return;
			}

			if (file.size > 1000000) {
				alert('File must be no larger than 1MB');
				input.value = '';
				return;
			}

			await loadImage(image, await readBlobAsDataURL(file));
			if (image.width <= 1 || image.height <= 1 || image.width > 2000 || image.height > 2000) {
				alert('Image must be between 2 and 2000 pixels in each dimension');
				input.value = '';
				return;
			}

			setWallDimensions({ width: image.width, height: image.height })
			setImageChosen(true);
		}

		setLoadingImage(true);
		try {
			await loadImageFromFile();
		} finally {
			setLoadingImage(false);
		}

	}, [fileInputRef, imageRef, setLoadingImage, setWallDimensions, setImageChosen]);

	const uploadWall = useCallback(async () => {
		const input = fileInputRef.current;
		const image = imageRef.current;

		if (!input || !image) {
			return;
		}

		if (!input.files || !input.files[0]) {
			input.value = '';
			return;
		}

		const file = input.files[0];
		if ((file.type !== 'image/jpeg' && file.type !== 'image/jpg') || file.size < 107) {
			alert('File must be a JPEG image');
			input.value = '';
			return;
		}

		if (file.size > 1000000) {
			alert('File must be no larger than 1MB');
			input.value = '';
			return;
		}

		const imageData = image.src.substr(image.src.indexOf(',') + 1);
		console.dir(holds);
		const response = await fetch('/api/walls', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				username,
				password,
				name: wallName,
				image: imageData,
				holdData: holds.map(h => h.path)
			})
		});

		if (response.ok) {
			const wallId = await response.json();
			history.push(`/wall/${wallId}`);
		}
		else {
			alert(`${response.status}: ${await response.text()}`);
		}
	}, [history, holds, username, password, wallName]);

	let drawing = useRef(false);
	let newPath: Point[] = [];

	const canvas1Ref = useRef<HTMLCanvasElement>(null);
	const canvas2Ref = useRef<HTMLCanvasElement>(null);

	const getCanvas1 = useCallback(() => canvas1Ref!.current!, [canvas1Ref]);
	const getCanvas2 = useCallback(() => canvas2Ref!.current!, [canvas2Ref]);
	const getCanvas1Context = useCallback(() => canvas1Ref!.current!.getContext('2d')!, [canvas1Ref]);
	// const getCanvas2Context = () => canvas2Ref!.current!.getContext('2d')!;

	function mouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
		if (imageChosen && !drawing.current) {
			drawing.current = true;
			const { left, top } = getCanvas1().getBoundingClientRect();
			const mouseX = e.clientX - left;
			const mouseY = e.clientY - top;

			newPath = [{ x: mouseX, y: mouseY }];

			const ctx = getCanvas1Context();
			ctx.strokeStyle = '#ffffffff';
			ctx.fillStyle = '#ffffff11';
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.moveTo(mouseX, mouseY);
		}
	}

	useEffect(() => {

		function mouseMove(e: MouseEvent) {
			if (imageChosen) {
				const { left, top } = getCanvas1().getBoundingClientRect();
				const mouseX = e.clientX - left;
				const mouseY = e.clientY - top;

				if (drawing.current) {
					const lastPoint = newPath[newPath.length - 1];
					if (lastPoint.x !== mouseX ||
						lastPoint.y !== mouseY
					) {
						newPath.push({ x: mouseX, y: mouseY });

						const ctx = getCanvas1Context();
						ctx.lineTo(mouseX, mouseY);
						ctx.stroke();
					}
				}

				const canvas2 = getCanvas2();
				const ctx = canvas2.getContext('2d')!;
				ctx.clearRect(0, 0, canvas2.width, canvas2.height);

				if (!drawing.current) {
					for (let i = holds.length - 1; i >= 0; --i) {
						const hold = holds[i];
						if (hold.isPointInBounds({ x: mouseX, y: mouseY }, ctx)) {
							ctx.fillStyle = '#00F';
							ctx.fill(hold.path2D);
							break;
						}
					}
				}
			}
		}

		function mouseUp() {
			if (imageChosen && drawing.current) {
				setHolds([ ...holds, new Hold(newPath) ]);
				console.log(holds);

				const ctx = getCanvas1Context();
				ctx.lineTo(newPath[0].x, newPath[0].y);
				ctx.stroke();
				ctx.fill();

				drawing.current = false;
			}
		}

		document.addEventListener('mousemove', mouseMove);
		document.addEventListener('mouseup', mouseUp);

		return () => {
			document.removeEventListener('mousemove', mouseMove);
			document.removeEventListener('mouseup', mouseUp);
		}
	}, [getCanvas1Context, getCanvas1, getCanvas2, holds, newPath, imageChosen]);

	return <>
		<label hidden={imageChosen}>
			{'Image: '}
			<input type='file' disabled={loadingImage} accept='image/jpeg,.jpg' ref={fileInputRef} onChange={loadImageFromFile} />
		</label>
		<div hidden={!imageChosen}>
			{'Wall name: '}<input type='text' onChange={e => setWallName(e.target.value)}></input>
			{' Username: '}<input type='text' onChange={e => setUsername(e.target.value)}></input>
			{' Password: '}<input type='password' onChange={e => setPassword(e.target.value)}></input>
			{' '}<button className="btn btn-primary" onClick={uploadWall}>Upload</button>
			<hr />
		</div>
		<div
			id='canvasContainer'
			hidden={!imageChosen}
			style={{ width: `${window.innerWidth}px`, height: `${window.innerHeight}px` }}
		>
			<img
				id='wallImage'
				alt=''
				ref={imageRef} />
			{wallDimensions && <div>
				<canvas
					id='canvas1'
					ref={canvas1Ref}
					width={wallDimensions.width}
					height={wallDimensions.height}
				/>
				<canvas
					id='canvas2'
					ref={canvas2Ref}
					width={wallDimensions.width}
					height={wallDimensions.height}

					onMouseDown={mouseDown}
				/>
			</div>}
		</div>
	</>;
});
