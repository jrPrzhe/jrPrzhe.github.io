import React, { useState, useEffect, useRef } from "react";
import { YMaps, Map, Placemark } from "@pbe/react-yandex-maps";
import io from "socket.io-client";
import "./App.css";

const socket = io("http://localhost:5000"); // URL вашего бекенда

function App() {
  const [data, setData] = useState({}); // Данные парковок
  const [modalData, setModalData] = useState(null); // Данные для модального окна
  const modalRef = useRef(null); // Ссылка на модальное окно для получения его размеров

  // Пример координат для парковочных мест
  const parkingPositions = {
    "par1.mp4": {
      lat: 52.2429,
      lon: 104.2535,
      positions: {
        "1": { x: 12, y: 8 },
        "2": { x: 20, y: 8 },
        "3": { x: 31, y: 15 },
      },
      name: "Показать par1",
      background: "background1.png", // Фоновое изображение для маркера
    },
    "par2.mp4": {
      lat: 52.2638,
      lon: 104.2545,
      positions: {
        "1": { x: 25, y: 35 },
        "2": { x: 55, y: 65 },
      },
      name: "Показать par2",
      background: "background2.png", // Фоновое изображение для маркера
    },
    "par3.mp4": {
      lat: 52.2725,
      lon: 104.2516,
      positions: {
        "1": { x: 30, y: 40 },
        "2": { x: 60, y: 70 },
      },
      name: "Показать par3",
      background: "background3.png", // Фоновое изображение для маркера
    },
  };

  // Обновление данных из WebSocket
  useEffect(() => {
    socket.on("update_data", (newData) => {
      setData(newData);
    });

    return () => {
      socket.off("update_data");
    };
  }, []);

  // Функция для обновления данных в модальном окне
  const handleUpdateData = () => {
    if (modalData) {
      const { prefix, background, positions } = modalData;

      // Обновляем данные в модальном окне, но сохраняем background
      const updatedData = Object.keys(data)
        .filter((key) => key.startsWith(prefix))
        .map((key) => {
          const placeId = key.split("/")[1];
          return {
            id: placeId,
            status: data[key] === "1" ? "Занято" : "Свободно",
            background, // Сохраняем фоновое изображение
            position: positions[placeId] || { x: 10, y: 0 },
          };
        });

      setModalData({ filteredData: updatedData, prefix, background, positions });
    }
  };

  // Функция для открытия модального окна с данными
  const openModal = (prefix, backgroundImage, positions) => {
    const filteredData = Object.keys(data)
      .filter((key) => key.startsWith(prefix))
      .map((key) => {
        const placeId = key.split("/")[1];
        return {
          id: placeId,
          status: data[key] === "1" ? "Занято" : "Свободно",
          background: backgroundImage ? `/images/${backgroundImage}` : null,
          position: positions[placeId] || { x: 10, y: 0 },
        };
      });

    setModalData({ filteredData, prefix, background: `/images/${backgroundImage}`, positions });
  };

  // Закрытие модального окна
  const closeModal = () => setModalData(null);

  // Функция для получения размеров модального окна
  const getModalSize = () => {
    if (modalRef.current) {
      const width = modalRef.current.clientWidth;
      const height = modalRef.current.clientHeight;
      return { width, height };
    }
    return { width: 0, height: 0 };
  };

  // Функция для получения реальных координат на основе размеров окна
  const calculatePosition = (position, modalSize) => {
    const { width, height } = modalSize;
    return {
      x: (position.x / 100) * width,
      y: (position.y / 100) * height,
    };
  };

  return (
    <div className="App">
      <h1>Парковочные места</h1>

      <div className="buttons">
        <button onClick={() => openModal("par1.mp4", "background1.png", parkingPositions["par1.mp4"].positions)}>
          Показать par1
        </button>
        <button onClick={() => openModal("par2.mp4", "background2.png", parkingPositions["par2.mp4"].positions)}>
          Показать par2
        </button>
        <button onClick={() => openModal("par3.mp4", "background3.png", parkingPositions["par3.mp4"].positions)}>
          Показать par3
        </button>
      </div>

      {/* Карта Яндекса */}
      <YMaps>
        <Map
          defaultState={{
            center: [52.2725, 104.2516], // Центр карты
            zoom: 12, // Масштаб
          }}
         
          width="100%"
          height="900px"
        >
          {/* Добавляем маркеры для парковок */}
          {Object.keys(parkingPositions).map((key) => {
            const { lat, lon, name, background } = parkingPositions[key];
            return (
              <Placemark
                key={key}
                geometry={[lat, lon]}
                properties={{
                  balloonContent: name,
                }}
                options={{
                  preset: 'islands#dotIcon', // Дефолтный маркер Яндекса
                  iconColor: '#ff0000', // Цвет маркера (красный, например)
                }}
                onClick={() => openModal(key, background, parkingPositions[key].positions)} // Открытие модального окна при клике
              />
            );
          })}
        </Map>
      </YMaps>

      {modalData && (
        <div className="modal">
          <div
            ref={modalRef} // Привязываем ссылку для получения размеров
            className="modal-content"
            style={{
              backgroundImage: modalData.background ? `url(${modalData.background})` : "none",
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              position: "relative",
              width: "100%",
              height: "100%",
            }}
          >
            <button className="close-btn" onClick={closeModal}>
              &times;
            </button>
            <h2>Данные парковочных мест</h2>
            <button className="update-btn" onClick={handleUpdateData}>Обновить</button> {/* Кнопка обновления данных внутри модального окна */}
            <ul>
              {modalData.filteredData.map((item) => {
                const modalSize = getModalSize(); // Получаем размеры модального окна
                const position = calculatePosition(item.position, modalSize); // Рассчитываем реальные координаты

                // Настройка размеров для free.png и close.png
                const imageStyle =
                  item.status === "Занято"
                    ? { width: "130px", height: "170px" } // Размер для "Занято"
                    : { width: "70px", height: "70px" }; // Размер для "Свободно"

                return (
                  <li key={item.id} className="parking-item">
                    <div
                      className="parking-info"
                      style={{
                        position: "absolute", // Абсолютное позиционирование
                        left: `${position.x}px`, // Позиция X в пикселях
                        top: `${position.y}px`, // Позиция Y в пикселях
                      }}
                    >
                      <span className="parking-id" style={{ display: "none" }}>Место {item.id}</span> {/* Скрываем текст */}
                      <div className="tooltip">
                        <img
                          src={item.status === "Занято" ? "/images/close.png" : "/images/free.png"}
                          alt={item.status}
                          style={imageStyle} // Применяем стили для разных изображений
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
