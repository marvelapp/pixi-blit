namespace pixi_blit {
	export class AtlasNode<T> {
		public childs: Array<AtlasNode<T>>;
		public rect: AtlasRectangle;
		public data: T;

		public constructor() {
			this.childs = new Array<AtlasNode<T>>();
			this.rect = new AtlasRectangle();
			this.data = null;
		}

		public insert(width: number, height: number, data: T): AtlasNode<T> {
			if (this.childs.length > 0) {
				let newNode: AtlasNode<T> = this.childs[0].insert(width, height, data);
				if (newNode != null) {
					return newNode;
				}
				return this.childs[1].insert(width, height, data);
			} else {
				let rect: AtlasRectangle = this.rect;
				if (this.data != null) return null;

				if (width > rect.width || height > rect.height) return null;

				if (width == rect.width && height == rect.height) {
					this.data = data;
					return this;
				}

				this.childs.push(AtlasNode.allocate());
				this.childs.push(AtlasNode.allocate());

				let dw: number = rect.width - width;
				let dh: number = rect.height - height;

				if (dw > dh) {
					this.childs[0].rect.set(rect.left, rect.top, width, rect.height);
					this.childs[1].rect.set(rect.left + width, rect.top, rect.width - width, rect.height);
				} else {
					this.childs[0].rect.set(rect.left, rect.top, rect.width, height);
					this.childs[1].rect.set(rect.left, rect.top + height, rect.width, rect.height - height);
				}

				return this.childs[0].insert(width, height, data);
			}
		}

		static pool: Array<any> = [];

		static allocate<T>() {
			return AtlasNode.pool.pop() as AtlasNode<T>
				|| new AtlasNode();
		}

		freeSubtree() {
			this.rect.set(0, 0, 1, 1);
			this.data = null;
			AtlasNode.pool.push(this);

			for (let i = 0; i < this.childs.length; i++) {
				this.childs[i].freeSubtree();
			}
			this.childs.length = 0;
		}
	}

	export class AtlasRectangle {
		public constructor(l: number = 0, t: number = 0, w: number = 0, h: number = 0) {
			this.left = l;
			this.top = t;
			this.width = w;
			this.height = h;
		}

		public left: number;
		public top: number;
		public height: number;
		public width: number;

		set(l: number, t: number, w: number, h: number) {
			this.left = l;
			this.top = t;
			this.width = w;
			this.height = h;
		}
	}
}
