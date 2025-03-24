import { Menu } from '../core/Menu';
import { createPositioningStrategy } from '../core/MenuPositioningStrategy';

describe('Menu', () => {
  let menu;
  const mockId = 'test-menu';
  const mockOptions = { autoHide: true, autoHideTimeout: 1000 };

  beforeEach(() => {
    menu = new Menu(mockId, mockOptions);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('should initialize with correct properties', () => {
    expect(menu.id).toBe(mockId);
    expect(menu.isVisible).toBe(false);
    expect(menu.options).toEqual(expect.objectContaining(mockOptions));
    expect(menu.items).toEqual([]);
  });

  test('should add items correctly', () => {
    const mockItem = { id: 'item1', label: 'Item 1' };
    menu.addItem(mockItem);
    expect(menu.items).toContain(mockItem);
  });

  test('should set multiple items correctly', () => {
    const mockItems = [
      { id: 'item1', label: 'Item 1' },
      { id: 'item2', label: 'Item 2' }
    ];
    menu.setItems(mockItems);
    expect(menu.items).toEqual(mockItems);
  });

  test('should show the menu and update position', () => {
    const mockTarget = { x: 100, y: 100 };
    const mockStrategy = createPositioningStrategy('bottom', { offsetY: 10 });
    menu.setPositioningStrategy(mockStrategy);
    
    const onShowMock = jest.fn();
    menu.setEventHandlers({ onShow: onShowMock });
    
    menu.show(mockTarget);
    
    expect(menu.isVisible).toBe(true);
    expect(menu.targetElement).toBe(mockTarget);
    expect(menu.position.x).toBe(100); // Position should be updated
    expect(menu.position.y).toBeGreaterThan(100); // Position with offset
    expect(onShowMock).toHaveBeenCalledWith(menu);
  });

  test('should hide the menu', () => {
    const onHideMock = jest.fn();
    menu.setEventHandlers({ onHide: onHideMock });
    
    // First show the menu
    menu.show({ x: 0, y: 0 });
    
    // Then hide it
    menu.hide();
    
    expect(menu.isVisible).toBe(false);
    expect(onHideMock).toHaveBeenCalledWith(menu);
  });

  test('should start auto-hide timer when shown with autoHide option', () => {
    const clearAutoHideTimerSpy = jest.spyOn(menu, 'clearAutoHideTimer');
    const hideSpy = jest.spyOn(menu, 'hide');
    
    menu.show({ x: 0, y: 0 });
    
    expect(clearAutoHideTimerSpy).toHaveBeenCalled();
    expect(menu.autoHideTimer).not.toBeNull();
    
    // Fast-forward time
    jest.advanceTimersByTime(1000);
    
    expect(hideSpy).toHaveBeenCalled();
  });

  test('should handle mouse enter and clear auto-hide timer', () => {
    const clearAutoHideTimerSpy = jest.spyOn(menu, 'clearAutoHideTimer');
    const onMouseEnterMock = jest.fn();
    menu.setEventHandlers({ onMouseEnter: onMouseEnterMock });
    
    menu.handleMouseEnter();
    
    expect(clearAutoHideTimerSpy).toHaveBeenCalled();
    expect(onMouseEnterMock).toHaveBeenCalledWith(menu);
  });

  test('should handle mouse leave and restart auto-hide timer', () => {
    const startAutoHideTimerSpy = jest.spyOn(menu, 'startAutoHideTimer');
    const onMouseLeaveMock = jest.fn();
    menu.setEventHandlers({ onMouseLeave: onMouseLeaveMock });
    
    menu.handleMouseLeave();
    
    expect(startAutoHideTimerSpy).toHaveBeenCalled();
    expect(onMouseLeaveMock).toHaveBeenCalledWith(menu);
  });

  test('should execute commands when handling item clicks', () => {
    const mockCommand = {
      execute: jest.fn().mockReturnValue(true)
    };
    
    const mockItems = [
      { id: 'item1', label: 'Item 1', command: mockCommand }
    ];
    
    menu.setItems(mockItems);
    
    const onItemClickMock = jest.fn();
    menu.setEventHandlers({ onItemClick: onItemClickMock });
    
    menu.handleItemClick('item1', { data: 'test' });
    
    expect(mockCommand.execute).toHaveBeenCalledWith({ data: 'test' });
    expect(onItemClickMock).toHaveBeenCalledWith('item1', { data: 'test' }, menu);
  });

  test('should clean up resources when disposed', () => {
    const clearAutoHideTimerSpy = jest.spyOn(menu, 'clearAutoHideTimer');
    
    // Add some items and event handlers
    menu.setItems([{ id: 'item1', label: 'Item 1' }]);
    menu.setEventHandlers({ onShow: jest.fn() });
    
    menu.dispose();
    
    expect(clearAutoHideTimerSpy).toHaveBeenCalled();
    expect(menu.items).toEqual([]);
    expect(menu.eventHandlers).toEqual({});
  });
});