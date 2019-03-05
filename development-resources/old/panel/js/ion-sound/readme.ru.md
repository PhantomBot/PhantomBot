![ion.sound](_tmp/logo-ion-sound.png)

> <a href="readme.md">English description</a> | Описание на русском

JavaScript-плагин для воспроизведения звуков

***

* Версия: 3.0.7
* <a href="http://ionden.com/a/plugins/ion.sound/index.html">Сайт проекта и демо</a>
* <a href="http://ionden.com/a/plugins/ion.sound/ion.sound-3.0.7.zip">Скачать ZIP-архив</a>

## Описание
* Ion.Sound — JavaScript-плагин для воспроизведения звуков, основанный на Web Audio API.
* Плагин отлично работает на всех десктопных и мобильных браузерах и может быть испльзован как на обычных веб сайтах, так и в играх.
* Для более старых браузеров плагин использует HTML5 audio.
* Плагин поддерживает работу с айдио-спрайтами
* Плагин свободно распространяется на условиях <a href="http://ionden.com/a/plugins/licence.html" target="_blank">лицензии MIT</a>.
* 25 бесплатных звуковых файлов включены в архив

Сегодня веб-сайты переполнены событиями (новое письмо, новое сообщение в чат, обновление контента и т.п.). Часто не достаточно одной визуальной индикации этих событий, что бы привлечь внимание пользователя. Необходимы звуки! В этом деле вам поможет этот плагин.
Так же новая версия Ion.Sound теперь отлично подходит для создания звукового сопровождения браузерных игр. Контроль загрузки аудио ресурсов, поддержка аудио-спрайтов и пр. помогут вам в этом.


## Поддерживаемые браузеры
### Desktop Windows, OS X, Linux:

* Google Chrome
* Mozilla Firefox
* Microsoft Internet Explorer 9.0+
* Opera 12.16+
* Safari 5.1+ (Safari на Windows требует установленный QuickTime для воспроизведения звуков)

### Mobile:

* iOS Safari и другие (с некоторыми <a href="https://developer.apple.com/library/safari/documentation/audiovideo/conceptual/using_html5_audio_video/device-specificconsiderations/device-specificconsiderations.html" target="_blank">ограничениями</a>)
* Android Google Chrome и другие (тоже с некоторыми ограничениями)
* WP8 Internet Explorer

Can i use <a href="http://caniuse.com/#feat=audio-api" target="_blank">Web Audio API</a> and <a href="http://caniuse.com/audio" target="_blank">HTML5 Audio</a>?


## Демо
* <a href="http://ionden.com/a/plugins/ion.sound/demo.html">Basic demo</a>
* <a href="http://ionden.com/a/plugins/ion.sound/demo_advanced.html">Advanced demo</a>


## Зависимости
* отсутствуют


## Подключение
Подключаем библиотеку:
* ion.sound.min.js

Готовим звуковые файлы (15 звуков включены в поставку) и складываем их в какую-либо папку (например "sounds"):
* my_cool_sound.mp3
* my_cool_sound.ogg
* my_cool_sound.aac

Помимо MP3-файла, нужно так же подготовить OGG и AAC-файл, так как не все браузеры поддерживают MP3.<br/>
Конвертировать MP3 в OGG и AAC можно на <a href="http://media.io/" target="_blank">Media.io</a> или на <a href="https://cloudconvert.org/formats#audio" target="_blank">CloudConvert.org</a>.<br/>
<i>Поддержка формата AAC была добавлена для улучшения совместимости с iOS 8.x устройствами (iPhone, iPad)</i>


## Устанавливаем с помощью bower
* bower install ionsound

## Устнавливаем с помощью npm
* npm install ion-sound

## Устанавливаем с помощью spm [![](http://spmjs.io/badge/ion-sound)](http://spmjs.io/package/ion-sound)
* spm install ion-sound


## Инициализация
Инициализируем плагин:
```javascript
ion.sound({
    sounds: [
        {
            name: "my_cool_sound"
        },
        {
            name: "notify_sound",
            volume: 0.2
        },
        {
            name: "alert_sound",
            volume: 0.3,
            preload: false
        }
    ],
    volume: 0.5,
    path: "sounds/",
    preload: true
});
```

Играем звук:
```javascript
// Самый простой вызов
ion.sound.play("my_cool_sound");
```


## Общие параметры

<table class="options">
    <thead>
        <tr>
            <th>Атрибут</th>
            <th>По умолчанию</th>
            <th>Тип</th>
            <th>Описание</th>
        </tr>
    </thead>
    <tbody>
        <tr class="options__step">
            <td>sounds</td>
            <td>-</td>
            <td>array</td>
            <td>Коллекция звуковых объектов. Каждый из объектов содержит информацию о подключаемом звуковом файле и (опционально) индивидуальные настройки.</td>
        </tr>

        <tr>
            <td>path</td>
            <td>-</td>
            <td>string</td>
            <td>Путь к файлу</td>
        </tr>
        <tr>
            <td>preload</td>
            <td>false</td>
            <td>boolean</td>
            <td>Предзагрузка звуков</td>
        </tr>
        <tr>
            <td>multiplay</td>
            <td>false</td>
            <td>boolean</td>
            <td>Множественное воспроизведение. Если включен, то звук можно будет воспроизводить неограниченно часто.</td>
        </tr>
        <tr>
            <td>loop</td>
            <td>false</td>
            <td>boolean/number</td>
            <td>Можно установить как в true, для бесконечного повтора, либо задать числом желаемое кол-во повторов.</td>
        </tr>
        <tr class="options__step">
            <td>volume</td>
            <td>1.0</td>
            <td>number</td>
            <td>Громкость звука от 0 до 1</td>
        </tr>

        <tr>
            <td>scope</td>
            <td>null</td>
            <td>object</td>
            <td>Объект, в контексте которого нужно вызывать коллбэки</td>
        </tr>
        <tr>
            <td>ready_callback</td>
            <td>null</td>
            <td>function</td>
            <td>Вызывается после завершения загрузки аудио файла (или готовности к воспроизведению у HTML5 audio)</td>
        </tr>
        <tr>
            <td>ended_callback</td>
            <td>null</td>
            <td>function</td>
            <td>Вызывается каждый раз, когда воспроизведение аудио файла подошло к концу</td>
        </tr>
    </tbody>
</table>


## Sound object

<table class="options">
    <thead>
        <tr>
            <th>Атрибут</th>
            <th>По умолчанию</th>
            <th>Тип</th>
            <th>Описание</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>name</td>
            <td>-</td>
            <td>string</td>
            <td>Имя файла в директории. Плагин сам выберет поддерживаемое расширение файла (.mp3, .ogg, .aac, .mp4 и т.д.)</td>
        </tr>
        <tr>
            <td>alias</td>
            <td>-</td>
            <td>string</td>
            <td>Синоним для вызова звука, не обязателен, нужен для краткости вызовов.</td>
        </tr>
        <tr>
            <td>sprite</td>
            <td>-</td>
            <td>object</td>
            <td>
                Указатель на то, что звук является аудио-спрайтом.
                Представляет из себя объект вида <code>{"part_name_1": [0, 2], "part_name_2": [2, 2]}</code><br/>
                Где part_name - это имя кусочка спрайта (по этому имени его можно будет вызывать в дальнейшем) и массив с временными указателями: [начало, длина] в секундах.
            </td>
        </tr>
        <tr>
            <td colspan="4">А так же свои собственные: path, preload, multiplay, loop, volume, scope and callbacks</td>
        </tr>
    </tbody>
</table>


## Возможность запуска в jQuery окружении:
* Все методы плагины можно вызывать используя синонимы: ion.sound(); -> $.ionSound();
* ion.sound.play("sound_name"); -> $.ionSound.play("sound_name");
* И т.д.


### <a href="history.md">История обновлений</a>

***

#### Поддержите разработку плагинов серии Ion:

* Пожертвовать через сервис Pledgie: [![](https://pledgie.com/campaigns/25694.png?skin_name=chrome)](https://pledgie.com/campaigns/25694)

* Пожертвовать напрямую через Paypal: https://www.paypal.me/IonDen

* Пожертвовать напрямую через Яндекс.Деньги: http://yasobe.ru/na/razrabotku
