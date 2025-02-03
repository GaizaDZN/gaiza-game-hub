const Store: React.FC = () => {
  return (
    <div className="store__container">
      <div className="store__buttons__container">
        <ul className="store__buttons">
          <li>Beans</li>
          <li>Water</li>
          <li>Milk</li>
          <li>Sugar</li>
        </ul>
      </div>

      <img className="store__bg" src="/src/assets/img/store.jpg"></img>
    </div>
  );
};

export default Store;
