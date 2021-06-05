
import * as THREE from "./libs/three.module.js";
//импорт библиотек для загрузки моделей и материалов
import { MTLLoader } from './libs/MTLLoader.js';
import { OBJLoader } from './libs/OBJLoader.js';
import { GLTFLoader } from './libs/GLTFLoader.js';

var gui = new dat.GUI();
gui.width = 200;

var brVis = false; 

var container;
var camera, scene, renderer;
var imagedata;
var N = 255;
var clock = new THREE.Clock;
var spheres = [];
var mixer, morphs = [];
var models = {};
var modelsclones = [];
var num = 0;
var ispos = new THREE.Vector3();

var keyboard = new THREEx.KeyboardState();
var camangle = 0;

var selected = null;

var mouse = { x: 0, y: 0 }; //переменная для хранения координат мыши
//массив для объектов, проверяемых на пересечение с курсором
var targetList = [];
var rad = 10;   
var geometry;    
var isPressed = false;  
var cursor; 
var cursor3D;
var circle;

const loader = new THREE.TextureLoader();
var cameraOrtho;
var sceneOrtho;
var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;
var button = [];

var La = 3; 
var x = 0; 
var sprName = 0;

var buttonName = [];


var forces = {};
forces.wind = new THREE.Vector3(0, 0, 0);
forces.gravity = new THREE.Vector3(0, -9.8, 0);


var emitter = {};
emitter.particles = [];
emitter.MaxParticles = 100;
emitter.orginPoint = new THREE.Vector3(N/2, 150, N/2);
emitter.diff = N/2;

var particleSets = {};
particleSets.lifetime = 3.0;
particleSets.mass = 2.0;

var raindrop = null;
var raincond = false;

    
init();
animate();
function getPixel( imagedata, x, y ){
 var position = ( x + imagedata.width * y ) * 4, data = imagedata.data;
 return data[ position ];; 
}

function init(){
    container = document.getElementById( 'container' );
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
    45, window.innerWidth / window.innerHeight, 1, 4000 );
    camera.position.set(N/2, N/2, N * 1.5 );
    camera.lookAt(new THREE.Vector3( N/2, 0.0, N/2));

    //создание ортогональной камеры
    cameraOrtho = new THREE.OrthographicCamera( - window.innerWidth / 2, window.innerWidth / 2, window.innerHeight / 2, - window.innerHeight / 2, 1, 10 );
    cameraOrtho.position.z = 10;
    //сцена для хранения списка объектов размещаемых в экранных координатах
    sceneOrtho = new THREE.Scene();
    

    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.autoClear = false;
    //отключение авто очистки рендера
    // Закрашивание экрана синим цветом, заданным в 16ричной системе
    renderer.setClearColor( 0x000000ff, 1);
    container.appendChild( renderer.domElement );
    // Добавление функции обработки события изменения размеров окна
    window.addEventListener( 'resize', onWindowResize, false ); 

    //создание точечного источника освещения заданного цвета
    var spotlight = new THREE.PointLight(0xffffff);
    //установка позиции источника освещения
    spotlight.position.set(N*2, N, N/2);
    //добавление источника в сцену
    scene.add(spotlight);
        
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var img = new Image();


    img.onload = function(){
        canvas.width = img.width;
        canvas.height = img.height;
        // context.drawImage(img, 0, 0 );
        imagedata = context.getImageData(0, 0, img.width, img.height);
        CreateTerrain();
    }
    
    img.src = 'pics/plateau.jpg';

    mixer = new THREE.AnimationMixer( scene ); 

    AddSphere(3000, "pics/sky-texture.jpg", 0.0001);
    
    //button = addSprite('pics/h1.jpg', 'pics/h2.jpg', 80, 64);

    

    renderer.domElement.addEventListener('mousemove',onDocumentMouseMove,false);
    renderer.domElement.addEventListener('mousedown',onDocumentMouseDown,false);
    renderer.domElement.addEventListener('mouseup',onDocumentMouseUp,false);
    renderer.domElement.addEventListener('wheel',onDocumentMouseScroll,false);


    
    add3Dcursor();

    circle = addCircle(32);
    cursor = add3Dcursor();

    circle.visible = false;
    cursor.visible = false;

    GUI();
 
    loadMesh('models/', "Cyprys_House.obj", "Cyprys_House.mtl", "house");
    loadMesh('models/', "grade.obj", "grade.mtl", "grade");
    loadMesh('models/', "Bush1.obj", "Bush1.mtl", "bash");


    for (var i = 0; i < La; i++){
        sprName += 1;
        var sprName1 = sprName + 1;
        addSprite('pics/h'+ sprName +'.jpg', 'pics/h'+ sprName1 + '.jpg', 90, 80, buttonName[i], x);
        x+=100;
        sprName += 1;       
    }

 raindrop = loadParticle('pics/dropp.png', 3, 3);

}

function onWindowResize(){
    // Изменение соотношения сторон для виртуальной камеры
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentMouseScroll( event ) {

    if(brVis == true){

        if(event.wheelDelta > 0){
            rad += 3;
        }
        if(event.wheelDelta < 0){
            rad -= 3;
        }
    
        circle.scale.set(rad, 1 , rad);
    }
}

function onDocumentMouseMove( event ) {
    //определение позиции мыши
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;
    //создание луча, исходящего из позиции камеры и проходящего сквозь позицию курсора мыши
    var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
    vector.unproject(camera);
    var ray = new THREE.Raycaster( camera.position,vector.sub( camera.position ).normalize() );
    // создание массива для хранения объектов, с которыми пересечётся луч
    var intersects = ray.intersectObjects( targetList );
    if(brVis == true){
        // если луч пересёк какой-либо объект из списка targetList
        if ( intersects.length > 0 ){
            cursor3D.position.copy(intersects[0].point);
            circle.position.copy(intersects[0].point);
            circle.position.y = 0;
            //console.log(intersects[0]);

            for (var i = 0; i < circle.geometry.attributes.position.array.length-1; i+=3){
                //получение позиции в локальной системе координат
                var pos = new THREE.Vector3();
                pos.x = circle.geometry.attributes.position.array[i];
                pos.y = circle.geometry.attributes.position.array[i+1];
                pos.z = circle.geometry.attributes.position.array[i+2];

                pos.applyMatrix4(circle.matrixWorld);

                var x = Math.round(pos.x);
                var z = Math.round(pos.z);

                var ind = (z + x * N) * 3;
                    
                    if(ind >= 0 && ind < geometry.attributes.position.array.length){
                        circle.geometry.attributes.position.array[i+1] = geometry.attributes.position.array[ind+1];
                    }
                    
                }
                circle.geometry.attributes.position.needsUpdate = true;
                circle.position.y += 1;

                //console.log(intersects);
        }
    }
    else{
        if (selected != null){
            if (isPressed == true){

                selected.position.copy(intersects[0].point);
                selected.userData.bbox.setFromObject(selected);

                var pos = new THREE.Vector3();
                selected.userData.bbox.getCenter(pos);

                //получение размеров объекта
                var size = new THREE.Vector3();
                selected.userData.bbox.getSize(size);

                //установка позиции и размера объекта в куб
                selected.userData.cube.position.copy(pos);
                selected.userData.cube.scale.set(size.x, size.y, size.z);
                
                selected.userData.bbox.getCenter(selected.userData.obb.position);

                for(var i = 0; i < modelsclones.length; i++){
                    if (modelsclones[i] !== selected.userData.cube){
                        var intr = false;

                        modelsclones[i].material.visible = false;
                        intr = intersect(selected.userData, modelsclones[i].userData.userData);
                        //объект пересечение с которым было обнаружено
                        //становится видимым
                        //console.log(intr);
                        if (intr == true){
                            modelsclones[i].material.visible = true;
                            break;
                        }
                    }
                }
            }
        }

        for(var i = 0; i < La; i++){

            if(buttonHover(event.clientX, event.clientY, button[i]) == true)
                button[i].sprite.material = button[i].mat2;
            
            else
                button[i].sprite.material = button[i].mat1; 
        }
    }
}

function onDocumentMouseDown( event ) {
    // if(brVis == true){
    //     isPressed = true;
    // }

    isPressed = true;
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;

    var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
    vector.unproject(camera);
    var ray = new THREE.Raycaster( camera.position,
    vector.sub( camera.position ).normalize() );
    var intersects = ray.intersectObjects( modelsclones, true );

    if ( intersects.length > 0 )
    {
        if (selected != null) 
        {
            selected.userData.cube.material.visible = false;
        };

        selected = intersects[0].object.userData;
        
        selected.userData.cube.material.visible = true;
        selected.userData.box.material.visible = false;
    }
    else
    {
        if (selected != null)
        {
            selected.userData.cube.material.visible = false;
            selected.userData.box.material.visible = false;
            selected = null;   
        }
    }

    if (brVis == false)
    {
        for (var i = 0; i < La; i++)
        {
            if (buttonHover(event.clientX, event.clientY, button[i]) == true){
                addMesh(button[i].addN);
            }
                
        }
    }
}

function onDocumentMouseUp( event ) {
    // if(brVis == true){
    //     isPressed = false;
    // }

    isPressed = false;

    for(var i = 0; i < modelsclones.length; i++)
    {
        if (modelsclones[i] !== selected.userData.cube)
        {
            var intr = false;

            modelsclones[i].material.visible = false;
            intr = intersect(selected.userData, modelsclones[i].userData.userData);

            //console.log(intr);

            //объект пересечение с которым было обнаружено
            //становится видимым
            if (intr == true)
            {
                var size = new THREE.Vector3();
                selected.userData.bbox.getSize(size);
                modelsclones[i].userData.userData.cube.material.visible = true;
                if(modelsclones[i].userData.userData.cube.position.x<=selected.position.x)
                {
                    selected.userData.cube.position.x = modelsclones[i].userData.userData.cube.position.x + size.x;
                }
                else if(modelsclones[i].userData.userData.cube.position.x>=selected.position.x)
                {
                    selected.userData.cube.position.x = modelsclones[i].userData.userData.cube.position.x - size.x;
                }

                var poz = new THREE.Vector3();

                poz.x = selected.userData.cube.position.x - selected.userData.obb.halfSize.x;
                poz.y = selected.userData.cube.position.y - selected.userData.obb.halfSize.y;
                poz.z = selected.userData.cube.position.z + selected.userData.obb.halfSize.z;

                selected.position.copy(poz);
            }
        }
    }

    //получение позиции центра объекта
    selected.userData.bbox.getCenter(selected.userData.obb.position);
    //получение размеров объекта
    selected.userData.bbox.getSize(selected.userData.obb.halfSize).multiplyScalar(0.5);
    //получение матрицы поворота объекта
    selected.userData.obb.basis.extractRotation(selected.matrixWorld);

    ispos = selected.position;
}

function animate(){

    var delta = clock.getDelta();
    
    if(brVis == true){
        if(isPressed == true){
            hsphere(1, delta);
        }
    }

    if (keyboard.pressed("left")) {
        camangle -= Math.PI/180;     
    }

    if (keyboard.pressed("right")) {
        camangle += Math.PI/180;        
    }

    if(raindrop != null){
        
        if (raincond == true)
            calculateParticles(delta);
        else
        {
            for(var i = 0; i < emitter.particles.length; i++)
            {
                removeParticle(i);
            }
        }

    }
        


    camera.position.set(N/2 + 300 * Math.cos(camangle), 200, N/2 + 300 * Math.sin(camangle));
    camera.lookAt(new THREE.Vector3( N/2, 0.0, N/2));

    requestAnimationFrame( animate );
    render();
}

function render(){
    renderer.clear();
    renderer.render( scene, camera );
    renderer.clearDepth();
    renderer.render( sceneOrtho, cameraOrtho );
}

function CreateTerrain(){ 
    
    var vertices = []; // Объявление массива для хранения вершин
    var faces = []; // Объявление массива для хранения индексов
    var uv = [];
    geometry = new THREE.BufferGeometry();// Создание структуры для хранения геометрии

    for(var i = 0; i < N; i++){

        for(var j = 0; j < N; j++)
        {
            var h = getPixel( imagedata, i, j )/10; 

            console.log(h);

            vertices.push( i, h, j);
            uv.push( i/(N-1), j/(N-1));
            
        };
    };

    for(var i = 0; i < N-1; i++){
        for(var j = 0; j < N-1; j++){

            faces.push(
                i + j*N, 
                (i+1) + j*N, 
                (i+1) + (j+1)*N);

            faces.push(
                i + j*N, 
                (i+1) +(j+1)*N, 
                i+(j+1)*N);

        };
    };


    //Добавление вершин и индексов в геометрию
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
    geometry.setIndex( faces );
    geometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( uv, 2 ) );

    
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();

       // Создание загрузчика текстур
    var loader = new THREE.TextureLoader();
    // Загрузка текстуры grasstile.jpg из папки pic
    var tex = loader.load( 'pics/landtile.jpg' );
    
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    
    var mat = new THREE.MeshLambertMaterial({
        map:tex,
        wireframe: false,
        side:THREE.DoubleSide
       });

    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    var triangleMesh = new THREE.Mesh(geometry, mat);
    triangleMesh.receiveShadow = true;
    triangleMesh.position.set(0.0, 0.0, 0.0);

    targetList.push(triangleMesh);
    scene.add(triangleMesh);
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

function add3Dcursor(){
    var geometry = new THREE.CylinderGeometry( 1.5, 0, 5, 64 );
    var cyMaterial = new THREE.MeshLambertMaterial( {color: 0x888888} );
    cursor3D = new THREE.Mesh( geometry, cyMaterial );
    cursor3D.visible = false;
    scene.add( cursor3D );
    return cursor3D;
}

function addCircle(L){
    //создание материала для пунктирной линии
    var dashed_material = new THREE.LineBasicMaterial( {
        color: 0xffff00, //цвет линии
    } );
   var points = []; //массив для хранения координат сегментов

    var k = 360 / L;

   for(var i = 0; i < L; i++){

        var x = Math.cos((i*k) * Math.PI/180)
        var z = Math.sin((i*k)* Math.PI/180)

        points.push( new THREE.Vector3( x, 0, z ) ); //начало линии
   }

   var geometry = new THREE.BufferGeometry().setFromPoints( points ); //создание геометрии
   var line = new THREE.LineLoop( geometry, dashed_material ); //создание модели

   line.computeLineDistances(); //вычисление дистанции между сегментами

   line.scale.set(rad, 1 , rad);
   line.visible = false; 
   scene.add(line); //добавление модели в сцену
   return line;
}

function hsphere(k, delta){

    var pos = new THREE.Vector3();
    pos.copy(cursor3D.position);

    var vertices = geometry.getAttribute("position"); //получение массива вершин плоскости

    for (var i = 0; i < vertices.array.length; i+=3) //перебор вершин
    {
        var x = vertices.array[i]; //получение координат вершин по X
        var z = vertices.array[i+2]; //получение координат вершин по Z

        var h = (rad*rad) - (((x - pos.x)*(x - pos.x))+((z - pos.z)*(z - pos.z)));

        if(h > 0){
            vertices.array[i+1] += Math.sqrt(h) * k * delta; //изменение координат по Y
        }
    }
    geometry.setAttribute( 'position', vertices ); //установка изменённых вершин
    geometry.computeVertexNormals(); //пересчёт нормалей
    geometry.attributes.position.needsUpdate = true; //обновление вершин
    geometry.attributes.normal.needsUpdate = true; //обновление нормалей
}

function GUI(){
    //массив переменных, ассоциированных с интерфейсом
    var params =
    {
        scale_obj: 0,
        rotate_obj: 0,
        brush: false,
        rain: false,
        windX: 0,
        windZ: 0,
        gravity: -9.8,
        addHouse: function() { addMesh("house") },
        addGrade: function() { addMesh("grade") },
        addBash: function() { addMesh("bash") },
        del: function() { delMesh() }
    };
    //создание вкладки
    var folder1 = gui.addFolder('scale');
    var meshScale = folder1.add( params, 'scale_obj' ).min(10).max(100).step(1).listen();
    //при запуске программы папка будет открыта
    folder1.open();

    meshScale.onChange(function(value) {
        if (selected != null )
        {
            selected.scale.set(value/10, value/10, value/10);

            selected.userData.bbox.setFromObject(selected);

            //обновление размеров коробки
            selected.userData.box.update();

             //получение позиции центра объекта
             var pos = new THREE.Vector3();
             selected.userData.bbox.getCenter(pos);

             //получение размеров объекта
             var size = new THREE.Vector3();
             selected.userData.bbox.getSize(size);

             //установка позиции и размера объекта в куб
             selected.userData.cube.position.copy(pos);
             selected.userData.cube.scale.set(size.x, size.y, size.z);
        }
    });

    var folder2 = gui.addFolder('rotate');
    var meshRotate = folder2.add( params, 'rotate_obj' ).min(0).max(360).step(1).listen();
    folder2.open();

    meshRotate.onChange(function(value) {

        if (selected != null )
        {
            selected.rotation.y = value*Math.PI/180;

            selected.userData.bbox.setFromObject(selected);
            var pos = new THREE.Vector3();
            selected.userData.bbox.getCenter(pos);
            
            selected.userData.cube.rotation.y = value*Math.PI/180;
            selected.userData.cube.position.copy(pos);

        }
    });

    var windX = folder2.add( params, 'windX' ).min(-15).max(15).step(1).listen();

    windX.onChange(function(value) {

        forces.wind = new THREE.Vector3(value, 0, 0);
        
    });

    var windZ = folder2.add( params, 'windZ' ).min(-15).max(15).step(1).listen();

    windZ.onChange(function(value) {

        forces.wind = new THREE.Vector3(0, 0, value);
        
    });

    var gravity = folder2.add( params, 'gravity' ).min(0).max(15).step(1).listen();

    gravity.onChange(function(value) {

        forces.gravity = new THREE.Vector3(0, -value, 0);
        
    });

    var folder3 = gui.addFolder('object')

    folder3.add( params, 'addHouse' ).name( "add house" );
    folder3.add( params, 'addGrade' ).name( "add grade" );
    folder3.add( params, 'addBash' ).name( "add bash" );
    folder3.add( params, 'del' ).name( "delete" );

    var cubeVisible = gui.add( params, 'brush' ).name('brush').listen();

    cubeVisible.onChange(function(value)
    {
        brVis = value;
        cursor3D.visible = value;  
        circle.visible = value; 
    });

    var cubeVisible1 = gui.add( params, 'rain' ).name('rain').listen();

    cubeVisible1.onChange(function(value)
    {
       raincond = value;
    });

    //при запуске программы интерфейс будет раскрыт
    gui.open();

}

function loadMesh(path, oname, mname, name)
{
    buttonName.push(name);
    const onProgress = function ( xhr ) { //выполняющаяся в процессе загрузки
        if ( xhr.lengthComputable ) {
        const percentComplete = xhr.loaded / xhr.total * 100;
        console.log( Math.round( percentComplete, 2 ) + '% downloaded' );
        }
        };
        const onError = function () { }; //выполняется в случае возникновения ошибки

        const manager = new THREE.LoadingManager();
        new MTLLoader( manager )
        .setPath( path ) //путь до модели
        .load( mname, function ( materials ) { //название материала
            materials.preload();
            new OBJLoader( manager )
                .setMaterials( materials ) //установка материала
                .setPath( path ) //путь до модели
                .load( oname, function ( object ) { //название модели

                   
                    models[name] = object;                   

                    }, onProgress, onError );
    } );
}

function addMesh(name)
{
    num++;
    var model1 = models[name].clone() 


    //позиция модели по координате X
    model1.position.x = Math.random() * N;
    model1.position.z = Math.random() * N;
    //масштаб модели
    model1.scale.set(7, 7, 7);

    //создание объекта Box3 и установка его вокруг объекта object
    model1.userData.bbox = new THREE.Box3();
    model1.userData.bbox.setFromObject(model1);


    var obb = {};
    //структура состоит из матрицы поворота, позиции и половины размера
    obb.basis = new THREE.Matrix4();
    obb.halfSize = new THREE.Vector3();
    obb.position = new THREE.Vector3();
    //получение позиции центра объекта
    model1.userData.bbox.getCenter(obb.position);
    //получение размеров объекта
    model1.userData.bbox.getSize(obb.halfSize).multiplyScalar(0.5);
    //получение матрицы поворота объекта
    obb.basis.extractRotation(model1.matrixWorld);
    //структура хранится в поле userData объекта
    model1.userData.obb = obb;

    //создание куба единичного размера
    var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    var material = new THREE.MeshBasicMaterial(
        { color: 0x00ff00, wireframe: true }
    );

    model1.userData.cube = new THREE.Mesh( geometry, material );
    scene.add( model1.userData.cube );

    scene.add( model1 );
    ispos = model1.position;
    //console.log(ispos);

    //получение позиции центра объекта
    var pos = new THREE.Vector3();
    model1.userData.bbox.getCenter(pos);

    //получение размеров объекта
    var size = new THREE.Vector3();
    model1.userData.bbox.getSize(size);

    //установка позиции и размера объекта в куб
    model1.userData.cube.position.copy(pos);
    model1.userData.cube.scale.set(size.x, size.y, size.z);
    
    model1.userData.cube.material.visible = false;

    model1.userData.cube.userData = model1;

    modelsclones.push(model1.userData.cube);

    

    //создание объекта, содержащего Box3 и модель параллелепипеда
    model1.userData.box = new THREE.BoxHelper( model1, 0xffff00 );
    //обновление размеров коробки
    model1.userData.box.update();

    //скрытие объекта
    model1.userData.box.material.visible = false;
    

    model1.userData.box.userData = model1;

    //добавление коробки в сцену
    scene.add( model1.userData.box );

    model1.name = num;

    //добавление модели в сцену
    scene.add( model1 );

   // modelsclones.push(model1.userData.box);
    
   //console.log(link.name);
   //console.log(modelsclones);------------
}

function delMesh(){
    if (selected != null)
    {
        console.log(selected.name);
        console.log(modelsclones);

        var index = modelsclones.indexOf(selected.userData.cube);
        if (index >= 0) {
            modelsclones.splice(index, 1);
        }

        scene.remove(selected.userData.box);
        scene.remove(selected.userData.cube);
        scene.remove(selected);
        selected = null;
        console.log(modelsclones);
    }
}

function intersect(ob1, ob2)
{
    var xAxisA = new THREE.Vector3();
    var yAxisA = new THREE.Vector3();
    var zAxisA = new THREE.Vector3();
    var xAxisB = new THREE.Vector3();
    var yAxisB = new THREE.Vector3();
    var zAxisB = new THREE.Vector3();
    var translation = new THREE.Vector3();
    var vector = new THREE.Vector3();

    var axisA = [];
    var axisB = [];
    var rotationMatrix = [ [], [], [] ];
    var rotationMatrixAbs = [ [], [], [] ];
    var _EPSILON = 1e-3;

    var halfSizeA, halfSizeB;
    var t, i;

    ob1.obb.basis.extractBasis( xAxisA, yAxisA, zAxisA );
    ob2.obb.basis.extractBasis( xAxisB, yAxisB, zAxisB );

    // push basis vectors into arrays, so you can access them via indices
    axisA.push( xAxisA, yAxisA, zAxisA );
    axisB.push( xAxisB, yAxisB, zAxisB );
    // get displacement vector
    vector.subVectors( ob2.obb.position, ob1.obb.position );
    // express the translation vector in the coordinate frame of the current
    // OBB (this)
    for ( i = 0; i < 3; i++ )
    {
        translation.setComponent( i, vector.dot( axisA[ i ] ) );
    }
    // generate a rotation matrix that transforms from world space to the
    // OBB's coordinate space
    for ( i = 0; i < 3; i++ )
    {
        for ( var j = 0; j < 3; j++ )
        {
            rotationMatrix[ i ][ j ] = axisA[ i ].dot( axisB[ j ] );
            rotationMatrixAbs[ i ][ j ] = Math.abs( rotationMatrix[ i ][ j ] ) + _EPSILON;
        }
    }
    // test the three major axes of this OBB
    for ( i = 0; i < 3; i++ )
    {
        vector.set( rotationMatrixAbs[ i ][ 0 ], rotationMatrixAbs[ i ][ 1 ], rotationMatrixAbs[ i ][ 2 ]);

        halfSizeA = ob1.obb.halfSize.getComponent( i );
        halfSizeB = ob2.obb.halfSize.dot( vector );

        if ( Math.abs( translation.getComponent( i ) ) > halfSizeA + halfSizeB )
        {
            return false;
        }
    }
    // test the three major axes of other OBB
    for ( i = 0; i < 3; i++ )
    {
        vector.set( rotationMatrixAbs[ 0 ][ i ], rotationMatrixAbs[ 1 ][ i ], rotationMatrixAbs[ 2 ][ i ] );
        halfSizeA = ob1.obb.halfSize.dot( vector );
        halfSizeB = ob2.obb.halfSize.getComponent( i );
        vector.set( rotationMatrix[ 0 ][ i ], rotationMatrix[ 1 ][ i ], rotationMatrix[ 2 ][ i ] );
        t = translation.dot( vector );
        if ( Math.abs( t ) > halfSizeA + halfSizeB )
        {
            return false;
        }
    }
    // test the 9 different cross-axes
    // A.x <cross> B.x
    halfSizeA = ob1.obb.halfSize.y * rotationMatrixAbs[ 2 ][ 0 ] + ob1.obb.halfSize.z *
    rotationMatrixAbs[ 1 ][ 0 ];
    halfSizeB = ob2.obb.halfSize.y * rotationMatrixAbs[ 0 ][ 2 ] + ob2.obb.halfSize.z *
    rotationMatrixAbs[ 0 ][ 1 ];
    t = translation.z * rotationMatrix[ 1 ][ 0 ] - translation.y * rotationMatrix[ 2 ][ 0 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
        return false;
    }
    // A.x < cross> B.y
    halfSizeA = ob1.obb.halfSize.y * rotationMatrixAbs[ 2 ][ 1 ] + ob1.obb.halfSize.z *
    rotationMatrixAbs[ 1 ][ 1 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 0 ][ 2 ] + ob2.obb.halfSize.z *
    rotationMatrixAbs[ 0 ][ 0 ];
    t = translation.z * rotationMatrix[ 1 ][ 1 ] - translation.y * rotationMatrix[ 2 ][ 1 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
        return false;
    }
    // A.x <cross> B.z
    halfSizeA = ob1.obb.halfSize.y * rotationMatrixAbs[ 2 ][ 2 ] + ob1.obb.halfSize.z *
    rotationMatrixAbs[ 1 ][ 2 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 0 ][ 1 ] + ob2.obb.halfSize.y *
    rotationMatrixAbs[ 0 ][ 0 ];
    t = translation.z * rotationMatrix[ 1 ][ 2 ] - translation.y * rotationMatrix[ 2 ][ 2 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
        return false;
    }
    // A.y <cross> B.x
    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 2 ][ 0 ] + ob1.obb.halfSize.z *
    rotationMatrixAbs[ 0 ][ 0 ];
    halfSizeB = ob2.obb.halfSize.y * rotationMatrixAbs[ 1 ][ 2 ] + ob2.obb.halfSize.z *
    rotationMatrixAbs[ 1 ][ 1 ];
    t = translation.x * rotationMatrix[ 2 ][ 0 ] - translation.z * rotationMatrix[ 0 ][ 0 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
        return false;
    }
    // A.y <cross> B.y
    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 2 ][ 1 ] + ob1.obb.halfSize.z *
    rotationMatrixAbs[ 0 ][ 1 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 1 ][ 2 ] + ob2.obb.halfSize.z *
    rotationMatrixAbs[ 1 ][ 0 ];
    t = translation.x * rotationMatrix[ 2 ][ 1 ] - translation.z * rotationMatrix[ 0 ][ 1 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
        return false;
    }
    // A.y <cross> B.z
    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 2 ][ 2 ] + ob1.obb.halfSize.z *
    rotationMatrixAbs[ 0 ][ 2 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 1 ][ 1 ] + ob2.obb.halfSize.y *
    rotationMatrixAbs[ 1 ][ 0 ];
    t = translation.x * rotationMatrix[ 2 ][ 2 ] - translation.z * rotationMatrix[ 0 ][ 2 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
        return false;
    }// A.z <cross> B.x
    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 1 ][ 0 ] + ob1.obb.halfSize.y *
    rotationMatrixAbs[ 0 ][ 0 ];
    halfSizeB = ob2.obb.halfSize.y * rotationMatrixAbs[ 2 ][ 2 ] + ob2.obb.halfSize.z *
    rotationMatrixAbs[ 2 ][ 1 ];
    t = translation.y * rotationMatrix[ 0 ][ 0 ] - translation.x * rotationMatrix[ 1 ][ 0 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
        return false;
    }
    // A.z <cross> B.y
    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 1 ][ 1 ] + ob1.obb.halfSize.y *
    rotationMatrixAbs[ 0 ][ 1 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 2 ][ 2 ] + ob2.obb.halfSize.z *
    rotationMatrixAbs[ 2 ][ 0 ];
    t = translation.y * rotationMatrix[ 0 ][ 1 ] - translation.x * rotationMatrix[ 1 ][ 1 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
        return false;
    }
    // A.z <cross> B.z
    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 1 ][ 2 ] + ob1.obb.halfSize.y *
    rotationMatrixAbs[ 0 ][ 2 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 2 ][ 1 ] + ob2.obb.halfSize.y *
    rotationMatrixAbs[ 2 ][ 0 ];
    t = translation.y * rotationMatrix[ 0 ][ 2 ] - translation.x * rotationMatrix[ 1 ][ 2 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
        return false;
    }
    // no separating axis exists, so the two OBB don't intersect
    return true;
}

function addSprite(name1, name2, scaleW, scaleH, addN, x)
{
    //загрузка текстуры спрайта
    var texture1 = loader.load(name1);
    var material1 = new THREE.SpriteMaterial( { map: texture1 } );

    var texture2 = loader.load(name2);
    var material2 = new THREE.SpriteMaterial( { map: texture2 } );

    //создание спрайта
    var sprite = new THREE.Sprite( material1);
    //центр и размер спрайта
    sprite.center.set( 0.0, 1.0 );
    sprite.scale.set( scaleW, scaleH, 1 );

    //позиция спрайта (центр экрана)
    sprite.position.set( -screenWidth / 2.0 + x, screenHeight / 2.0, 1 );
    sceneOrtho.add(sprite);

    var sprt = {};
    sprt.sprite = sprite;

    sprt.mat1 = material1;
    sprt.mat2 = material2;

    sprt.w = scaleW;
    sprt.h = scaleH; 

    sprt.left = sprite.position.x;
    sprt.up = sprite.position.y;

    sprt.addN = addN;

    sprt.x = x;


    button.push(sprt);
    return sprt;

    screenWidth += screenWidth;
}

function updateHUDSprite(sprite)
{
    var width = window.innerWidth / 2;
    var height = window.innerHeight / 2;

    sprite.position.set( -width, height, 1 ); // левый верхний угол экрана
}

function buttonHover(MouseX, MouseY, btn){

    MouseX = MouseX - screenWidth / 2.0;
    MouseY = (MouseY - screenHeight / 2.0) * -1;

    if(btn.left < MouseX && MouseX < (btn.left + btn.w))
    if((btn.up) > MouseY && MouseY > (btn.up - btn.h)){
        return true;
    }

    return false;

}

function loadParticle(name1, scaleW, scaleH)
{
    //загрузка текстуры спрайта
    var texture1 = loader.load(name1);
    var material1 = new THREE.SpriteMaterial( { map: texture1 } );

    //создание спрайта
    var sprite = new THREE.Sprite( material1 );

    //центр и размер спрайта
    sprite.center.set( 0.0, 1.0 );
    sprite.scale.set( scaleW, scaleH, 1 );

    //позиция спрайта (центр экрана)
    sprite.position.set( 0, 0, 0 );
    return sprite;
}

function addParticle()
{
    if(emitter.particles.length < emitter.MaxParticles)
    {
        var particle = {};
        particle.sprite = raindrop.clone();

        var x = emitter.orginPoint.x + (emitter.diff - Math.random()*(emitter.diff*2));
        var z = emitter.orginPoint.z + (emitter.diff - Math.random()*(emitter.diff*2));

        particle.pos = new THREE.Vector3(x, emitter.orginPoint.y, z);
        particle.v = new THREE.Vector3(0, -20.0, 0);

        particle.sprite.position.copy(particle.pos);

        particle.m = (Math.random()*particleSets.mass) + 1;
        particle.lifetime = (Math.random() * particleSets.lifetime) + 2;

        emitter.particles.push(particle);
        scene.add(particle.sprite);
    }    
}

function calculateParticles(delta)
{
    addParticle();

    for(var i = 0; i < emitter.particles.length; i++)
    {
        emitter.particles[i].lifetime -= delta;

        if (emitter.particles[i].lifetime <= 0)
            removeParticle(i);

        if (emitter.particles[i].sprite.position.y <= 0)
            removeParticle(i);

        var v = new THREE.Vector3();
        
        emitter.particles[i].v.add(forces.gravity);

        emitter.particles[i].v.add(forces.wind);

        v.copy(emitter.particles[i].v);

        v.multiplyScalar(delta);

        emitter.particles[i].sprite.position.add(v); 
    }
}

function removeParticle(ind)
{
    scene.remove(emitter.particles[ind].sprite);
    emitter.particles.splice(ind, 1);
}


