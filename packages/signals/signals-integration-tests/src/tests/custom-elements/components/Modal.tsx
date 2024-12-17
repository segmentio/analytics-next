import { Modal as RACModal, ModalOverlayProps } from 'react-aria-components'
import './Modal.css'
import React from 'react'

export function Modal(props: ModalOverlayProps) {
  return <RACModal {...props} />
}
