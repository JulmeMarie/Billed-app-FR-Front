/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom"
import userEvent from '@testing-library/user-event';

import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

describe("Given I am connected as an employee", () => {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  window.localStorage.setItem('user', JSON.stringify({
    type: 'Employee'
  }))

  describe("When I am on NewBill Page", () => {
    test("Then i should find a bill form", () => {
      const html = NewBillUI()
      document.body.innerHTML = html;
      expect(screen.getByTestId("form-new-bill")).not.toBeNull();
    })
  });
  describe('When I select a file through the file input', () => {
    var fileInput = null;
    var fileChange = null;
    beforeEach(() => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const container = new NewBill({
        document,
        onNavigate,
        firestore: null,
        localStorage,
      });
      fileChange = jest.fn(container.handleChangeFile);
      fileInput = screen.getByTestId("file");//document.querySelector(`input[data-testid="file"]`);

      fileInput.addEventListener('change', (e) => {
        fileChange(e);
      });
    });

    describe('If the file is a jpg or png image', () => {
      test("Then the visual cue to indicate the wrong input shouldn't be displayed and the file should be uploaded", () => {
        const file = new File(['hello'], 'hello.png', { type: 'image/png' });

        fileInput.classList.add('is-invalid');
        userEvent.upload(fileInput, file);
        expect(fileChange).toHaveBeenCalled();
        expect(fileInput.files[0]).toStrictEqual(file);
        expect(fileInput.files.item(0)).toStrictEqual(file);
        expect(fileInput.files).toHaveLength(1);
        expect(fileInput.classList.contains('is-invalid')).toBeFalsy();
      });
    });

    describe('If the file is not a jpg or png image', () => {
      test('Then the visual cue to indicate the wrong input shouldn be displayed and the file should not be uploaded', () => {
        const file = new File(['hello'], 'hello.bmp', { type: 'image/bmp' });
        userEvent.upload(fileInput, file);
        expect(fileChange).toHaveBeenCalled();
        expect(fileInput.files[0]).toStrictEqual(file);
        expect(fileInput.files.item(0)).toStrictEqual(file);
        expect(fileInput.files).toHaveLength(1);
        expect(fileInput.classList.contains('is-invalid')).toBeTruthy();
      });
    });
  });

  describe('When I submit the new bill form', () => {
    const html = NewBillUI();
    document.body.innerHTML = html;

    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };
    const newBill = new NewBill({
      document,
      onNavigate,
      firestore: null,
      localStorage,
    });

    test('Then the handleSubmit method should be called', () => {

      const form = document.querySelector(
        `form[data-testid="form-new-bill"]`
      );
      const handleSubmitSpy = jest.spyOn(newBill, 'handleSubmit');
      form.addEventListener('submit', handleSubmitSpy);
      fireEvent.submit(form);
      expect(handleSubmitSpy).toHaveBeenCalled();
    });
  });
});