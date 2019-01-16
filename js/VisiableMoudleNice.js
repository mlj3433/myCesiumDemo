	var lng_start,lat_start,height_start,lng_stop,lat_stop,height_stop;
	var lng_lerp=[],lat_lerp=[],height_lerp=[];
	var cartographic=[];
	var cartographic_lerp=[];
	var height_terrain=[];
	var isSeen=true;
	var visiableOrNot;
	var inPoint=[];
	var outPoint=[];
	var m=0;
	var n=0;
	var scartesian,ecartesian;		//起点和终点的地理坐标
	var handler;
	function visiableSelectPoint(){
		handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
		handler.setInputAction(function(movement) {
			lng_start=null;
			lat_start=null;
			height_start=null;
			lng_stop=null;
			lat_stop=null;
			height_stop=null;
			lng_lerp=[],lat_lerp=[],height_lerp=[];
			cartographic=[];
			cartographic_lerp=[];
			height_terrain=[];
			isSeen=true;
			visiableOrNot=null;;
			inPoint=[];
			outPoint=[];
			m=0;
			n=0;
			//document.getElementById("measure-result").style.display = 'bolck';
			document.getElementById("measure-result").innerHTML = '<span>当前正在进行：<br/>通视分析</span>';
			//获取起点表面坐标
			var adaptivePosition=viewer.scene.pickPosition(movement.position);
			scartesian=viewer.scene.pickPosition(movement.position);
			if (scene.pickPositionSupported && Cesium.defined(adaptivePosition)) {
				//转成经纬度坐标
				var positionCarto = Cesium.Cartographic.fromCartesian(adaptivePosition); 
				//起点的经纬度和高度
				lng_start = Cesium.Math.toDegrees(positionCarto.longitude).toFixed(8);
				lat_start = Cesium.Math.toDegrees(positionCarto.latitude).toFixed(8);
				height_start= positionCarto.height;
				//在地图上显示
				var point_start={
					position : Cesium.Cartesian3.fromDegrees(parseFloat(lng_start),parseFloat(lat_start),parseFloat(height_start)),
					billboard : {
						image : './img/marker.png',
						color: Cesium.Color.GREEN,
						scale : 0.3,
						verticalOrigin : Cesium.VerticalOrigin.BOTTOM
						}
					}
					viewer.entities.add(point_start);
				}
			//鼠标左键添加起点
		}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
		
		handler.setInputAction(function(movement) {
			//获取终点表面坐标
			var adaptivePosition=viewer.scene.pickPosition(movement.position);
			ecartesian=viewer.scene.pickPosition(movement.position);
			if (scene.pickPositionSupported && Cesium.defined(adaptivePosition)) {
				//转成经纬度
				var positionCarto = Cesium.Cartographic.fromCartesian(adaptivePosition);
				//终点的经纬度和高度
				lng_stop = Cesium.Math.toDegrees(positionCarto.longitude).toFixed(8);
				lat_stop = Cesium.Math.toDegrees(positionCarto.latitude).toFixed(8);
				height_stop= positionCarto.height; 
				//在地球上显示
				var point_stop={
					position : Cesium.Cartesian3.fromDegrees(parseFloat(lng_stop),parseFloat(lat_stop),parseFloat(height_stop)),
					billboard : {
						image : './img/marker.png',
						color: Cesium.Color.RED,
						scale : 0.3,
						verticalOrigin : Cesium.VerticalOrigin.BOTTOM
					}
				}
				viewer.entities.add(point_stop);
			}
				document.getElementById("measure-result").innerHTML = '<span>当前正在进行：<br/>请继续</span>';
				visiableDraw();
				//右键选择终点且同时会执行函数
			}, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
		}
		
		function visiableDraw(){
			
			for(var i=0;i<=1000;i++){
				//分成1000份差值
				lng_lerp[i]=parseFloat(lng_start)+parseFloat(i*(lng_stop-lng_start)/1000);
				lat_lerp[i]=parseFloat(lat_start)+parseFloat(i*(lat_stop-lat_start)/1000);
				height_lerp[i]=parseFloat(height_start)+parseFloat(i*(height_stop-height_start)/1000);
				
				//将每个插值点存入cartographic数组
				cartographic.push(Cesium.Cartographic.fromDegrees(lng_lerp[i], lat_lerp[i], height_lerp[i]));
				cartographic_lerp.push(Cesium.Cartographic.fromDegrees(lng_lerp[i], lat_lerp[i], height_lerp[i]));
			}

			var sceneHeight = [];
			for(var i = 0; i< cartographic.length;i++){
				sceneHeight[i] = viewer.scene.sampleHeight(cartographic[i]);
			}
				
			
			for(var i=10;i<=1001;i++){
				var forward_hl =height_lerp[i-1];
				var forward_ht = sceneHeight[i-1];
				if(forward_ht-forward_hl>=2){
					isSeen=false;
				}
			}
			if(isSeen==true){
				var visiableLine_Positions = Cesium.Ellipsoid.WGS84.cartographicArrayToCartesianArray(cartographic_lerp);
				var visiableLine = viewer.entities.add({
					name: 'polyline',
					polyline: {
						positions: visiableLine_Positions,     
							width: 5,
						material: Cesium.Color.GREEN
					}
				});
				//visiableOrNot="通视";
				//document.getElementById("measure-result").innerHTML='<span>两点之间：' + visiableOrNot +'</span>';
			}
			else{
				for(var i=1;i<=1001;i++){
					var forward_hl2 =height_lerp[i-1];
					var forward_ht2 = sceneHeight[i-1];
					var backward_ht2 = sceneHeight[i];
					var backward_hl2 = height_lerp[i];
					if(forward_hl2>=forward_ht2){
						//入点
						if(backward_hl2<backward_ht2){
							inPoint[m]=i;
							m++;
						}
					}
					    //出点
					else{
						if(backward_hl2>backward_ht2){
							outPoint[n]=i;
							n++;
						}
					}
				}
				
			
				var inLine=cartographic_lerp.slice(0,inPoint[0]);
				var outLine=cartographic_lerp.slice(inPoint[0]);
				var inLine_Positions = Cesium.Ellipsoid.WGS84.cartographicArrayToCartesianArray(inLine);
				var partvisiableLine = viewer.entities.add({
					name: 'polyline',
					polyline: {
						positions: inLine_Positions,     
						width: 5,
						material: Cesium.Color.GREEN
					}
				});
				var outLine_Positions = Cesium.Ellipsoid.WGS84.cartographicArrayToCartesianArray(outLine);
				var invisiableLine = viewer.entities.add({
					name: 'polyline',
					polyline: {
						positions: outLine_Positions,     
						width: 5,
						material: Cesium.Color.RED
					}
				});
				
				//visiableOrNot="不通视";
				//document.getElementById("measure-result").innerHTML='<span>两点之间：' + visiableOrNot + '</span>';
			
			
		
			}
		}
		var clickTimes1=true;
		$("#visible-switch").click(function(){
			if(clickTimes1==true){
				alert('请用鼠标左键选择起点，右键选择终点！再次点击该按钮通视分析结束');
				//var terrainProvider = new Cesium.CesiumTerrainProvider({
					//url : 'https://www.supermapol.com/realspace/services/3D-stk_terrain/rest/realspace/datas/info/data/path/'
				//});
				//viewer.terrainProvider=terrainProvider;
				var measureResult = document.getElementById('measure-result-window');
				var measureResultShow = document.getElementById('measure-result');
				if(measureResult.style.display != 'block')
				{
					measureResult.style.display = 'block';
				}
				measureResultShow.innerHTML = "<span>暂无操作</span>";
				visiableSelectPoint();
				return clickTimes1=false;
				alert(clickTimes1);
			}
			if (clickTimes1==false) {
				
				//viewer.terrainProvider = ellipsoidTerrainProvider;
				viewer.entities.removeAll();
				handler.removeInputAction(Cesium.ScreenSpaceEventType.DOUBLE_CLICK);
				handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
				//$("#visiableTips").css("display", "none");
				// handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);  
				// handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
				alert("通视分析结束！");
				return clickTimes1=true; 
			}

		});