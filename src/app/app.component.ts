import { Component, ViewChild, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { Http, ResponseContentType } from '@angular/http';
import { forEach } from '@angular/router/src/utils/collection';
import { GeoLocationService } from './geoLocationService';

interface WheelItem {
  color: string;
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
  providers: [GeoLocationService],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements AfterViewInit {

  public selection: string;
  public context: CanvasRenderingContext2D;
  public ctx: CanvasRenderingContext2D;
  public canvas: any;
  public wheelItems: WheelItem[] = [];
  public option: string;
  private _isShowList: boolean = false;
  public listStatusLabel: string = "Show";
  private colorBank: string[] = ['#ff8000', "#ff00ff", "#0000ff", "#80ff00"];

  private slices;
  private sliceDeg;
  private deg = 0;
  private width;
  private center;
  private speed = 0;
  private slowDownRand = 0;
  private isStopped = true;
  private lock = false;

  private lng: number;
  private lat: number;


  @ViewChild("myCanvas") myCanvas;

  constructor(private http: Http, private geoLocationService: GeoLocationService) {
    this.geoLocationService.getLocation(null).subscribe((res) => {
      console.log(res);
      this.lat = res.coords.latitude;
      this.lng = res.coords.longitude;
      this.getPlaces().subscribe(res => {
        let result = res.json();
        console.log(res);
        result.results.forEach(i => {
          this.addOption(i.name, i.photos);
        });
      }, (err) => {
        console.log(err)
      });
    }, (err) => {
      console.log(err);
    })
  }

  ngAfterViewInit() {

    this.deg = this.rand(0, 360);
    this.canvas = this.myCanvas.nativeElement;
    this.context = this.canvas.getContext("2d");
    this.ctx = this.context;
    this.width = this.canvas.width; // size
    this.center = this.width / 2;      // center
    this.canvas.addEventListener("mouseup", (e) => {
      if (this.isStopped) {
        this.selection = null;
        this.isStopped = !this.isStopped;
        this.anim();
      } else {
        this.isStopped = !this.isStopped;
      }
    }, false);
    this.refreshWheel();
  }

  public set isShowList(val: boolean) {
    this._isShowList = val;
    this.listStatusLabel = val ? "Hide" : "Show";
  }

  listStatusToggle() {
    this.isShowList = !this._isShowList;
  }

  private getPlaces() {
    let apiRoot = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${this.lat},${this.lng}&radius=500&type=restaurant&key=AIzaSyCc6GSnPh4DgBkgj_ffdYTjPizW1oJaxMU`
    return this.http.get(apiRoot, {
      responseType: ResponseContentType.Json
    });

  }

  private refreshWheel() {
    this.slices = this.wheelItems.length;
    this.sliceDeg = 360 / this.slices;
    for (var i = 0; i < this.slices; i++) {
      this.drawSlice(this.deg, this.wheelItems[i].color);
      this.drawText(this.deg + this.sliceDeg / 2, this.wheelItems[i].label);
      this.deg += this.sliceDeg;
    }
  }

  addOption(option: string, icon: string) {
    this.option = null;
    this.wheelItems.push(
      {
        label: option,
        color: this.colorBank[this.wheelItems.length % this.colorBank.length],
        icon: icon
      }
    );
    this.refreshWheel();
  }

  private spin() {
    this.isStopped = false;
    this.anim();
  }

  deg2rad(deg) {
    return deg * Math.PI / 180;
  }

  drawSlice(deg, color) {
    this.ctx.beginPath();
    this.ctx.fillStyle = color;
    this.ctx.moveTo(this.center, this.center);
    this.ctx.arc(this.center, this.center, this.width / 2, this.deg2rad(deg), this.deg2rad(deg + this.sliceDeg));
    this.ctx.lineTo(this.center, this.center);
    this.ctx.fill();
  }

  drawImg() {
    this.ctx.clearRect(0, 0, this.width, this.width);
    for (var i = 0; i < this.slices; i++) {
      this.drawSlice(this.deg, this.wheelItems[i].color);
      this.drawText(this.deg + this.sliceDeg / 2, this.wheelItems[i].label);
      this.deg += this.sliceDeg;
    }
  }

  drawText(deg, text) {
    this.ctx.save();
    this.ctx.translate(this.center, this.center);
    this.ctx.rotate(this.deg2rad(deg));
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "#fff";
   
    this.ctx.font = 'bold 10px sans-serif';
    this.ctx.fillText(text, 130, 10);
    this.ctx.restore();
  }

  rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  removeLabel(index: number) {
    this.wheelItems.splice(index, 1);
    this.refreshWheel();
  }

  anim() {
    this.deg += this.speed;
    this.deg %= 360;

    // Increment speed
    if (!this.isStopped && this.speed < 3) {
      this.speed = this.speed + 25;
    }
    // Decrement Speed
    if (this.isStopped) {
      if (!this.lock) {
        this.lock = true;
        this.slowDownRand = this.rand(0.85, 0.96);
      }
      this.speed = this.speed > 0.2 ? this.speed *= this.slowDownRand : 0;
    }
    // Stopped!
    if (this.lock && !this.speed) {
      var ai = Math.floor(((360 - this.deg - 90) % 360) / this.sliceDeg); // deg 2 Array Index
      ai = (this.slices + ai) % this.slices; // Fix negative index
      console.log("You got:\n" + this.wheelItems[ai].label); // Get Array Item from end Degree
      return this.selection = this.wheelItems[ai].label;
    }

    this.drawImg();
    window.requestAnimationFrame(() => {
      this.anim();
    });

  };

}
