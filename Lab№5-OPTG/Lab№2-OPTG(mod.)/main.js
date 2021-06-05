var container;// Ссылка на элемент веб страницы в котором будет отображаться графика
var camera, scene, renderer;// Переменные "камера", "сцена" и "отрисовщик"
var clock = new THREE.Clock();
var keyboard = new THREEx.KeyboardState();
var planets = []; 
var spheres = [];
var cloud = {};
var moon = {};
var earthcloud = {}; 
var planetsSpriteName = [];
var keycount = -1; 
var cam_angle = 0;
var camangle = 0;
var orbmoon;



var cameraOrtho;
var sceneOrtho;

var loader = new THREE.TextureLoader();

var sW = window.innerWidth;
var sH = window.innerHeight;

var emitter = {};
emitter.logos = [];

var delta;


init();
animate();

function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;// Изменение соотношения сторон для виртуальной камеры
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );   // Изменение соотношения сторон рендера
}

function init(){
    // Получение ссылки на элемент html страницы
    container = document.getElementById( 'container' );
    // Создание "сцены"
    scene = new THREE.Scene();
    // Установка параметров камеры
    // 45 - угол обзора
    // window.innerWidth / window.innerHeight - соотношение сторон
    // 1 - 4000 - ближняя и дальняя плоскости отсечения
    camera = new THREE.PerspectiveCamera(
    45, window.innerWidth / window.innerHeight, 1, 4000 );
    // Установка позиции камеры
    camera.position.set(150, 80, 0);

    // Установка точки, на которую камера будет смотреть
    camera.lookAt(new THREE.Vector3( 0, 0.0, 0));

    //создание ортогональной камеры
    cameraOrtho = new THREE.OrthographicCamera
    ( - window.innerWidth / 2, 
        window.innerWidth / 2, window.innerHeight / 2, 
        -window.innerHeight / 2, 
        1, 
        10 );

    cameraOrtho.position.z = 10;
    //сцена для хранения списка объектов размещаемых в экранных координатах
    sceneOrtho = new THREE.Scene();
    //отключение авто очистки рендера

    // Создание отрисовщика
    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setSize( window.innerWidth, window.innerHeight );

    renderer.autoClear = false;

    // Закрашивание экрана синим цветом, заданным в 16ричной системе
    renderer.setClearColor( 0x000000ff, 1);
    container.appendChild( renderer.domElement );

    window.addEventListener( 'resize', onWindowResize, false );    // Добавление функции обработки события изменения размеров окна

    var spotlight = new THREE.PointLight(0xffffff);
    spotlight.position.set(0, 0, 0);
    var light = new THREE.AmbientLight(0x474747);

    scene.add(spotlight);
    scene.add(light);

    AddSphere(10, "pics/sunmap.jpg", 0.008)
    AddSphere(2000, "pics/starmap.jpg", 0.0001)

    AddPlanet(2, 25, 'pics/mercurymap.jpg', 'pics/mercurybump.jpg', ' ', 0.8, 0.015)
    orbits(25);

    AddPlanet(3, 40,'pics/venusmap.jpg', 'pics/venusbump.jpg', ' ', 0.6, 0.01)
    orbits(40);
    
    AddPlanet(4, 60,'pics/earthmap1k.jpg', 'pics/earthbump1k.jpg', 'pics/earthlights1k.jpg', 0.4, 0.007)
    createEarthCloud(4.1, 60, 0.4, 0.3);
    orbits(60);

    AddMoon(1.5, 8, 'pics/moonmap1k.jpg', 'pics/moonbump1k.jpg', ' ', 2 , 0.7)
    orbmoon = orbits(8);

    AddPlanet(3.5, 80,'pics/marsmap1k.jpg', 'pics/marsbump1k.jpg', ' ', 0.2, 0.009)
    orbits(80);


    if (emitter.logos.length < planets.length + 1)
    {
        
        for (var i = 0; i < planets.length + 1; i++)
        {
            var SN = i+1;
            var logo = {};
            logo.sprite = loadParticle('pics/L'+ SN +'.png', 4, 2);
            logo.pos =  new THREE.Vector3(0, 0, 0); 
            logo.sprite.position.copy(logo.pos);
            emitter.logos.push(logo);
        }
    }

}

function AddSphere(r, tmap, s1){
    var geometry = new THREE.SphereGeometry( r, 32, 32 );

    var loader = new THREE.TextureLoader();

    //загрузка текстуры
    var tex = loader.load( tmap );
    
    tex.minFilter = THREE.NearestFilter;
    //создание материала
    var material = new THREE.MeshBasicMaterial({
    map: tex,
    side: THREE.DoubleSide
    });

    //создание объекта
    var sphere = new THREE.Mesh( geometry, material );
    //размещение объекта в сцене
    scene.add( sphere );

    var planet = {};
    planet.sphere = sphere;
    planet.s1 = s1;
    planet.a1 = 0.0;

    spheres.push(planet);
}

function AddPlanet(r, x, tmap, bmap, smap, s1, s2){

    var geometry = new THREE.SphereGeometry( r, 32, 32 );
    var loader = new THREE.TextureLoader();

    //Загрузка текстур
    var tex = loader.load( tmap);
    var bump = loader.load( bmap );
    var specMap = loader.load( smap);
    
    tex.minFilter = THREE.NearestFilter;
    
    //Назначение карты и масштабирования высот
    var material = new THREE.MeshPhongMaterial({
        map: tex,
        specularMap: specMap,
        specular: new THREE.Color('grey'),
        bumpMap: bump,
        bumpScale: 0.05,
        side: THREE.DoubleSide
    });

    var sphere = new THREE.Mesh( geometry, material );//Создание объекта
    scene.add( sphere );//Размещение объекта в сцене

    sphere.position.x = x;
    
    var planet = {};
    planet.sphere = sphere;
    planet.pos = x;
    planet.s1 = s1;
    planet.a1 = 0.0;
    planet.s2 = s2;
    planet.a2 = 0.0;

    planets.push(planet);
}

function AddMoon(r, x, tmap, bmap, smap, s1, s2){

    var geometry = new THREE.SphereGeometry( r, 32, 32 );
    var loader = new THREE.TextureLoader();

    //Загрузка текстур
    var tex = loader.load( tmap );
    var bump = loader.load( bmap);
    var specMap = loader.load( smap);
    
    tex.minFilter = THREE.NearestFilter;
    
    //Назначение карты и масштабирования высот
    var material = new THREE.MeshPhongMaterial({
        map: tex,
        specularMap: specMap,
        specular: new THREE.Color('grey'),
        bumpMap: bump,
        bumpScale: 0.05,
        side: THREE.DoubleSide
    });

    var sphere = new THREE.Mesh( geometry, material );//Создание объекта
    scene.add( sphere );//Размещение объекта в сцене

    sphere.position.x = x;
    
    moon.sphere = sphere;
    moon.pos = x;
    moon.s1 = s1;
    moon.a1 = 0.0;
    moon.s2 = s2;
    moon.a2 = 0.0;
}

function orbits(r){
    var dashed_material = new THREE.LineDashedMaterial( {
        color: 0xffff00, //цвет линии
        dashSize: 2, //размер сегмента
        gapSize: 2, //величина отступа между сегментами
        } );

    var points = []; //массив для хранения координат сегментов

    for(var i = 0; i < 360; i++){
        
        var x = 0 + r * Math.cos(i*Math.PI/180);
        var z = 0 + r * Math.sin(i*Math.PI/180);

        points.push( new THREE.Vector3( x, 0, z ) ); //начало линии
    }

    var geometry = new THREE.BufferGeometry().setFromPoints( points ); //создание геометрии
    var line = new THREE.Line( geometry, dashed_material ); //создание модели

    line.computeLineDistances(); //вычисление дистанции между сегментами
    scene.add(line); //добавление модели в сцену
    return line;
}

function animate(){    
    var delta = clock.getDelta();
    moving();

    for (var i = 0; i < planets.length; i++) {
        planets[i].a1 += planets[i].s1 * delta;

        var x = 0 + planets[i].pos * Math.cos(planets[i].a1);
        var z = 0 + planets[i].pos * Math.sin(planets[i].a1);    

        planets[i].sphere.position.set(x, 0, z);

        planets[i].a2 = planets[i].s2;

        var axis = new THREE.Vector3(0, 1, 0);

        planets[i].sphere.rotateOnAxis(axis, planets[i].a2);
    }

    for (var i = 0; i < spheres.length; i++){
        spheres[i].a1 = spheres[i].s1;

        var axis1 = new THREE.Vector3(0, 1, 0);

        spheres[i].sphere.rotateOnAxis(axis1, spheres[i].a1);
    }

    moon.a1 += moon.s1 * delta;   

    var x = planets[2].sphere.position.x + moon.pos * Math.cos(moon.a1);
    var z = planets[2].sphere.position.z + moon.pos * Math.sin(moon.a1);

    orbmoon.position.set(planets[2].sphere.position.x, 0, planets[2].sphere.position.z);

    moon.sphere.position.set(x, 0, z);
    moon.a2 = moon.s2*delta;

    var axis1 = new THREE.Vector3(0, 1, 0);    
    moon.sphere.rotateOnAxis(axis1, moon.a2);

    var x = 60 + moon.pos * Math.cos(i*Math.PI/180);
    var z = 60 + moon.pos * Math.sin(i*Math.PI/180);


    cloud.a1 += cloud.s1 * delta;

    var x =  cloud.pos * Math.cos(cloud.a1);
    var z =  cloud.pos * Math.sin(cloud.a1);

    cloud.sphere.position.set(x, 0, z);

    cloud.a2 = cloud.s2*delta;

    var axis1 = new THREE.Vector3(0, 1, 0);    

    cloud.sphere.rotateOnAxis(axis1, cloud.a2);



    requestAnimationFrame( animate );
    render();
}

function moving(){
    if(keyboard.pressed("0")){
        keycount = 0;
    }
    if(keyboard.pressed("1")){
        keycount = 1;
    }
    if(keyboard.pressed("2")){
        keycount = 2;
    }
    if(keyboard.pressed("3")){
        keycount = 3;
    }
    if(keyboard.pressed("4")){
        keycount = 4;
    }
    if (keyboard.pressed("5")) {
        keycount = 5;        
    }

    if(keyboard.pressed("left")){
        cam_angle += Math.PI/180;
    }
    if(keyboard.pressed("right")){
        cam_angle -= Math.PI/180;
    }
    if(keyboard.pressed("up")){
        camangle += Math.PI/180;
    }
    if(keyboard.pressed("down")){
        camangle -= Math.PI/180;
    }

    if(keycount == 0){
        calculateParticles();

        for(var j = 0; j < emitter.logos.length; j++){
            emitter.logos[j].sprite.material.visible = true;
        }

        camera.position.set(150* Math.cos(cam_angle), 100 * Math.cos(camangle), 150 * Math.sin(cam_angle));
        camera.lookAt(new THREE.Vector3(0, 0.0, 0));

        sceneOrtho.clear();
    }

    if(keycount == 5)
    {
        calculateParticles();
        
        for(var j = 0; j < emitter.logos.length; j++)
        {
            emitter.logos[j].sprite.material.visible = false;
        }
        // emitter.logos[keycount-1].sprite.material.visible = true;

        //camera.position.set(Moon.sphere.position.x + 10, 10, Moon.sphere.position.z);
        camera.position.set(moon.sphere.position.x + 20 * Math.cos(cam_angle), 10 * Math.cos(camangle + 100), moon.sphere.position.z + 10 * Math.sin(cam_angle));
        camera.lookAt(new THREE.Vector3( moon.sphere.position.x, 0.0, moon.sphere.position.z));
        addSprite('pics/М'+ keycount +'.png', 400, 400, );
    }

    for(var i = 0; i < planets.length; i++){
        if(keycount == i + 1){

            calculateParticles();

            for(var j = 0; j < emitter.logos.length; j++)
            {
                emitter.logos[j].sprite.material.visible = false;
            }
            // emitter.logos[keycount-1].sprite.material.visible = true;

            camera.position.set(planets[i].sphere.position.x + 20 * Math.cos(cam_angle), 8 + Math.cos(camangle + 100), planets[i].sphere.position.z + 10 * Math.sin(cam_angle));
            camera.lookAt(new THREE.Vector3(planets[i].sphere.position.x, 0.0, planets[i].sphere.position.z));
            addSprite('pics/М'+ keycount +'.png', 400, 400, );
        }
    }

}

function render(){
    // Рисование кадра
    renderer.clear();
    renderer.render( scene, camera );
    renderer.clearDepth();
    renderer.render( sceneOrtho, cameraOrtho );
}

function createEarthCloud(r, x, s1, s2){
 // create destination canvas
 var canvasResult = document.createElement('canvas');
 canvasResult.width = 1024;
 canvasResult.height = 512;
 var contextResult = canvasResult.getContext('2d');
 // load earthcloudmap
 var imageMap = new Image();
 imageMap.addEventListener("load", function(){
 // create dataMap ImageData for earthcloudmap
 var canvasMap = document.createElement('canvas');
 canvasMap.width = imageMap.width;
 canvasMap.height = imageMap.height;
 var contextMap = canvasMap.getContext('2d');
 contextMap.drawImage(imageMap, 0, 0);
 var dataMap = contextMap.getImageData(0, 0, canvasMap.width, canvasMap.height);
 // load earthcloudmaptrans
 var imageTrans = new Image();
 imageTrans.addEventListener("load", function(){
 // create dataTrans ImageData for earthcloudmaptrans
 var canvasTrans = document.createElement('canvas');
 canvasTrans.width = imageTrans.width;
 canvasTrans.height = imageTrans.height;
 var contextTrans = canvasTrans.getContext('2d');
 contextTrans.drawImage(imageTrans, 0, 0);
 var dataTrans = contextTrans.getImageData(0, 0, canvasTrans.width,
canvasTrans.height);
 // merge dataMap + dataTrans into dataResult
 var dataResult = contextMap.createImageData(canvasMap.width, canvasMap.height);
 for(var y = 0, offset = 0; y < imageMap.height; y++)
 for(var x = 0; x < imageMap.width; x++, offset += 4){
 dataResult.data[offset+0] = dataMap.data[offset+0];
 dataResult.data[offset+1] = dataMap.data[offset+1];
 dataResult.data[offset+2] = dataMap.data[offset+2];
 dataResult.data[offset+3] = 255-dataTrans.data[offset+0];
 }
 // update texture with result
 contextResult.putImageData(dataResult,0,0)
 material.map.needsUpdate = true;
 });

 imageTrans.src = 'pics/earthcloudmaptrans.jpg';
 }, false);

 imageMap.src = 'pics/earthcloudmap.jpg';

 var geometry = new THREE.SphereGeometry(r, 32, 32);
 var material = new THREE.MeshPhongMaterial({
 map: new THREE.Texture(canvasResult),
 side: THREE.DoubleSide,
 transparent: true,
 opacity: 0.8,
 });

 var mesh = new THREE.Mesh(geometry, material);
 scene.add(mesh);

 mesh.position.x = x;
    
 cloud.sphere = mesh;
 cloud.pos = x;
 cloud.s1 = s1;
 cloud.a1 = 0.0;
 cloud.s2 = s2;
 cloud.a2 = 0.0;


}

function addSprite(name, scalW, scalH)
{
    //загрузка текстуры спрайта
    var texture1 = loader.load(name);
    var material1 = new THREE.SpriteMaterial( { map: texture1 } );

    //создание спрайта
    var sprite = new THREE.Sprite( material1 );
    //центр и размер спрайта
    sprite.center.set( 0.0, 1.0 );
    sprite.scale.set( scalW, scalH, 1 );
    //позиция спрайта (центр экрана)
    sprite.position.set( sW/6, sH/6, 1 );
    //sprite.position.set( 0, 0, 1 );
    sceneOrtho.add(sprite);

    var sprt = {};
    sprt.sprite = sprite;

    sprt.w = scalW;
    sprt.h = scalH;

    sprt.leftcorn = sprite.position.x;
    sprt.upcorn = sprite.position.y;

    return sprt;
}

function updateHUDSprite(sprite)
{
    var width = window.innerWidth / 2;
    var height = window.innerHeight / 2;

    sprite.position.set( -width, height, 1 );
}

function loadParticle(name1, scalW, scalH)
{
    //загрузка текстуры спрайта
    var texture1 = loader.load(name1);
    var material1 = new THREE.SpriteMaterial( { map: texture1 } );

    //создание спрайта
    var sprite = new THREE.Sprite( material1 );

    //центр и размер спрайта
    sprite.center.set( 0.0, 1.0 );
    sprite.scale.set( scalW, scalH, 1 );

    //позиция спрайта (центр экрана)
    sprite.position.set( 0, 0, 0 );   

    return sprite;
}

function addParticle()
{
    
    for (var i = 0; i < emitter.logos.length; i++)
    {
        scene.add(emitter.logos[i].sprite);
    }
    
}

function calculateParticles()
{
    addParticle();

    
    for(var i = 0; i < emitter.logos.length - 1; i++)
    {
        emitter.logos[i].sprite.position.copy(planets[i].sphere.position);
        emitter.logos[i].sprite.position.y = 6;
        emitter.logos[i].sprite.position.z = planets[i].sphere.position.z + 2;

        emitter.logos[emitter.logos.length - 1].sprite.position.copy(moon.sphere.position); 
        emitter.logos[emitter.logos.length - 1].sprite.position.y = 4;
        emitter.logos[emitter.logos.length - 1].sprite.position.z = moon.sphere.position.z + 2;
        
    }

}
    
function removeParticle(ind)
{
    //console.log(emitter.logos[ind].sprite);
    scene.remove(emitter.logos[ind].sprite);
    emitter.logos.splice(ind, 1);
}


