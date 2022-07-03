import { Form, Formik } from "formik";
import { FiCheck } from "react-icons/fi";
import CloseHeader from "../../../components/CloseHeader";
import LabelInput from "../../../components/form/LabelInput";
import Modal from "../../../components/Modal";
import { WeightSchema } from "./schema";

export default function WeightModal({
    state,
    onClose,
    userInfo,
    weight,
    onWeightChanged,
}) {
    function submit(updatedWeight) {
        onWeightChanged(WeightSchema.cast(updatedWeight));
        onClose();
    }

    // Guard against undefined references.
    // These fields should have a value by the time state is set to States.Open
    if (!userInfo || !weight) return null;

    return (
        <Modal
            isOpen={state === WeightModal.States.Open}
            shouldCloseOnOverlayClick={true}
            onClose={onClose}
        >
            <CloseHeader onClick={onClose}>
                <hgroup>
                    <h2>Edit Weight</h2>
                    <h2>{`${userInfo.firstName} ${userInfo.lastName}`}</h2>
                </hgroup>
            </CloseHeader>
            <Formik initialValues={weight}
                onSubmit={submit}
                validationSchema={WeightSchema}>
                <Form noValidate>
                    <LabelInput
                        type="text"
                        name="weight"
                        label="Weight"
                        inputMode="decimal"
                        pattern="[0-9.]*"
                        tooltip='Enter a weight, percentage, or exact amount!'
                        showTooltipOnFocus
                    />
                    <button type="submit" className="contrast">
                        <FiCheck className="icon" />
                        Apply
                    </button>
                </Form>
            </Formik>
        </Modal>
    );
}

WeightModal.States = Object.freeze({
    Closed: 0,
    Open: 1,
});
